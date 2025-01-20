const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const { auth } = require('express-openid-connect');
const { Parser } = require('json2csv');
const fs = require('fs-extra');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dinamo',
    password: 'bazepodataka',
    port: 5433,
});

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: 'HBHQSJ3LXiFwvUMg8uvK85LN34miVDAXPNjeReuoApT0zM_8rMHRE8vIIxTw2fYv',
    baseURL: 'http://localhost:3000',
    clientID: 'JBjg8MCWmaKeT7585Q6rAUO6sHKrpUmb',
    issuerBaseURL: 'https://dev-nculzp066u6p88ki.us.auth0.com',
  };
  
app.use(auth(config));
  

app.use(cors());
app.use(express.json()); 
app.use(express.static(__dirname));
app.use(express.static('public'));


app.get('/profile', (req, res) => {
    if (req.oidc.isAuthenticated()) {
        res.send(`
            <h1>Hello ${req.oidc.user.name}</h1>
            <p>Welcome to your profile page.</p>
            <p>Email: ${req.oidc.user.email}</p>
            <div>
                <pre>${JSON.stringify(req.oidc.user, null, 2)}</pre>
            </div>
            <a href="/logout">Logout</a>
        `);
    } else {
        res.send('User is not authenticated');
    }
});


// app.get('/players', async (req, res) => {
//     if (!req.oidc.isAuthenticated()) {
//         res.status(401).send('Please log in to view this page');
//     } else {
//         try {
//         const result = await pool.query(`
//             SELECT 
//                 igraci.ime, 
//                 igraci.prezime, 
//                 igraci.broj, 
//                 igraci.pozicija, 
//                 igraci.datum_rodenja, 
//                 igraci.mjesto_rodenja, 
//                 igraci.visina, 
//                 igraci.broj_nastupa, 
//                 igraci.broj_golova, 
//                 STRING_AGG(igrac_klub.ime_kluba || ' (' || klubovi.grad || ')', ', ') AS klubovi
//             FROM igraci
//             JOIN igrac_klub ON igraci.prezime = igrac_klub.prezime
//             JOIN klubovi ON igrac_klub.ime_kluba = klubovi.ime
//             GROUP BY igraci.ime, igraci.prezime, igraci.broj, igraci.pozicija, igraci.datum_rodenja, igraci.mjesto_rodenja, igraci.visina, igraci.broj_nastupa, igraci.broj_golova
//         `);
//         res.json({ data: result.rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Error retrieving data from database');
//     }
//     }

// });


app.get('/players', async (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        res.status(401).send('Please log in to view this page');
    } else {
        try {
            const result = await pool.query(`
                SELECT 
                    igraci.ime, 
                    igraci.prezime, 
                    igraci.pozicija, 
                    igraci.datum_rodenja
                FROM igraci
            `);
            const players = result.rows.map(player => ({
                "@context": "https://schema.org",
                "@type": "Person",
                "name": `${player.ime} ${player.prezime}`,
                "jobTitle": player.pozicija,
                "birthDate": player.datum_rodenja.toISOString().split('T')[0] // Format as YYYY-MM-DD
            }));
            res.json(players);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error retrieving data from database');
        }
    }
});


app.post('/players', async (req, res) => {
    const { ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova, prosli_klubovi } = req.body;
    try {
        await pool.query('BEGIN');

        await pool.query(
            `INSERT INTO igraci (ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova]
        );

        for (const klub of prosli_klubovi) {
            const clubExists = await pool.query(
                `SELECT 1 FROM klubovi WHERE ime = $1`,
                [klub.Ime_kluba]
            );

            if (clubExists.rows.length === 0) {
                await pool.query(
                    `INSERT INTO klubovi (ime, grad) VALUES ($1, $2)`,
                    [klub.Ime_kluba, klub.Grad_kluba]
                );
            }

            await pool.query(
                `INSERT INTO igrac_klub (prezime, ime_kluba) 
                 VALUES ($1, $2)`,
                [prezime, klub.Ime_kluba]
            );
        }

        await pool.query('COMMIT');
        res.status(201).json({ message: 'Player added successfully', player: { ime, prezime } });
    } catch (err) {
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



app.get('/refresh-snapshots', async (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        return res.status(401).send('Unauthorized - Please log in to access this resource.');
    }

    try {
        const query = `
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
                STRING_AGG(klubovi.ime || ' (' || klubovi.grad || ')', ', ') AS klubovi
            FROM 
                public.igraci
            JOIN 
                public.igrac_klub ON igraci.prezime = igrac_klub.prezime
            JOIN 
                public.klubovi ON igrac_klub.ime_kluba = klubovi.ime
            GROUP BY 
                igraci.ime, igraci.prezime, igraci.broj, igraci.pozicija, igraci.datum_rodenja, igraci.mjesto_rodenja, igraci.visina, igraci.broj_nastupa, igraci.broj_golova;
        `;
        const result = await pool.query(query);
        const players = result.rows;

        const csvFilePath = path.join(__dirname, 'igraci_nogometnog_kluba_dinamo.csv');
        const jsonFilePath = path.join(__dirname, 'igraci_nogometnog_kluba_dinamo.json');

        const fields = ['ime', 'prezime', 'broj', 'pozicija', 'datum_rodenja', 'mjesto_rodenja', 'visina', 'broj_nastupa', 'broj_golova', 'klubovi'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(players);

        await fs.outputFile(csvFilePath, csv);

        await fs.outputFile(jsonFilePath, JSON.stringify(players, null, 2));

        res.send('Data snapshots refreshed and saved.');
    } catch (error) {
        console.error('Failed to refresh snapshots:', error);
        res.status(500).send('Server error occurred while refreshing data snapshots.');
    }
});



app.get('/check-auth', (req, res) => {
    res.json({ isAuthenticated: req.oidc.isAuthenticated() });
});


app.get('/api-docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'igraci_dinama_openAPI.json'));
  });


app.get('/logout', (req, res) => {
    req.oidc.logout({
        returnTo: process.env.BASE_URL
    });
});

  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
