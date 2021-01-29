define(['require', 'mssql'], function(require){
    let username = '';
    let password = '';







    let sql = require('mssql');

    const config = {
        user: username,
        password: password,
        server: 'titan.csse.rose-hulman.edu',
        database: 'ClubGearLocker_S1G5_jacksob1_buczkob1_sorensej'
    };

    sql.on('error', (err) => {
        console.error(err);
    });

    sql.connect(config).then((pool) => {
        return pool.request().query('SELECT * FROM Item');
    }).then((result) => {
        console.dir(result)
    }).catch((err) => {
        console.error(err)
    })
})