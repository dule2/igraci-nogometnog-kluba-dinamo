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
        console.error(err);
        res.status(500).send('Error retrieving data from database');
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


