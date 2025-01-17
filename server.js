const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dinamo',
    password: 'bazepodataka',
    port: 5433,
});

app.use(cors());
app.use(express.json()); // Ensure this middleware is in place to parse JSON body
app.use(express.static(__dirname));

app.get('/players', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                igraci.ime, 
                igraci.prezime, 
                igraci.broj, 
                igraci.pozicija, 
                igraci.datum_rodenja, 
                igraci.mjesto_rodenja, 
                igraci.visina, 
                igraci.broj_nastupa, 
                igraci.broj_golova, 
                STRING_AGG(igrac_klub.ime_kluba || ' (' || klubovi.grad || ')', ', ') AS klubovi
            FROM igraci
            JOIN igrac_klub ON igraci.prezime = igrac_klub.prezime
            JOIN klubovi ON igrac_klub.ime_kluba = klubovi.ime
            GROUP BY igraci.ime, igraci.prezime, igraci.broj, igraci.pozicija, igraci.datum_rodenja, igraci.mjesto_rodenja, igraci.visina, igraci.broj_nastupa, igraci.broj_golova
        `);
        res.json({ data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data from database');
    }
});

app.post('/players', async (req, res) => {
    const { ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova, prosli_klubovi } = req.body;
    try {
        // Start database transaction
        await pool.query('BEGIN');

        // Insert the player into the igraci table
        await pool.query(
            `INSERT INTO igraci (ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova]
        );

        // Handle clubs associated with the player
        for (const klub of prosli_klubovi) {
            // Check if the club already exists
            const clubExists = await pool.query(
                `SELECT 1 FROM klubovi WHERE ime = $1`,
                [klub.Ime_kluba]
            );

            // If the club does not exist, insert it
            if (clubExists.rows.length === 0) {
                await pool.query(
                    `INSERT INTO klubovi (ime, grad) VALUES ($1, $2)`,
                    [klub.Ime_kluba, klub.Grad_kluba]
                );
            }

            // Insert into igrac_klub
            await pool.query(
                `INSERT INTO igrac_klub (prezime, ime_kluba) 
                 VALUES ($1, $2)`,
                [prezime, klub.Ime_kluba]
            );
        }

        // Commit the transaction
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Player added successfully', player: { ime, prezime } });
    } catch (err) {
        // Rollback the transaction on error
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Error adding player to the database');
    }
});


app.get('/players/:broj', async (req, res) => {
    const { broj } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                igraci.ime, 
                igraci.prezime, 
                igraci.broj, 
                igraci.pozicija, 
                igraci.datum_rodenja, 
                igraci.mjesto_rodenja, 
                igraci.visina, 
                igraci.broj_nastupa, 
                igraci.broj_golova, 
                STRING_AGG(igrac_klub.ime_kluba || ' (' || klubovi.grad || ')', ', ') AS klubovi
            FROM igraci
            LEFT JOIN igrac_klub ON igraci.prezime = igrac_klub.prezime
            LEFT JOIN klubovi ON igrac_klub.ime_kluba = klubovi.ime
            WHERE igraci.broj = $1
            GROUP BY igraci.ime, igraci.prezime, igraci.broj, igraci.pozicija, igraci.datum_rodenja, igraci.mjesto_rodenja, igraci.visina, igraci.broj_nastupa, igraci.broj_golova
        `, [broj]);

        if (result.rows.length === 0) {
            res.status(404).send('Player not found');
        } else {
            res.json({ data: result.rows[0] });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data from the database');
    }
});

app.put('/players/:broj', async (req, res) => {
    const { broj } = req.params;
    const { ime, prezime, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova } = req.body;

    try {
        const result = await pool.query(
            `UPDATE igraci
             SET ime = $1, prezime = $2, pozicija = $3, datum_rodenja = $4, mjesto_rodenja = $5, visina = $6, broj_nastupa = $7, broj_golova = $8
             WHERE broj = $9`,
            [ime, prezime, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova, broj]
        );

        if (result.rowCount === 0) {
            res.status(404).send('Player not found');
        } else {
            res.json({ message: 'Player updated successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating player in the database');
    }
});

app.delete('/players/:broj', async (req, res) => {
    const { broj } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM igraci
             WHERE broj = $1`,
            [broj]
        );

        if (result.rowCount === 0) {
            res.status(404).send('Player not found');
        } else {
            res.json({ message: 'Player deleted successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting player from the database');
    }
});

app.get('/players/position/:position', async (req, res) => {
    const { position } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM igraci WHERE pozicija = $1`,
            [position]
        );
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).send('No players found for this position');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving players from the database');
    }
});

app.get('/players/appearances/:minAppearances', async (req, res) => {
    const { minAppearances } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM igraci WHERE broj_nastupa >= $1`,
            [parseInt(minAppearances)]
        );
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).send('No players found with these many appearances');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving players from the database');
    }
});


app.get('/players/goals/:minGoals', async (req, res) => {
    const { minGoals } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM igraci WHERE broj_golova >= $1`,
            [parseInt(minGoals)]
        );
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).send('No players found with these many goals');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving players from the database');
    }
});

app.get('/api-docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'igraci_dinama_openAPI.json'));
  });
  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
