'use strict';
var express = require('express');
var router = express.Router();
var sql = require('mssql/msnodesqlv8');
var multiparty = require('multiparty');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

router.post('/search', async function (req, res) {
    var form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
        if (!err) {
            var date1 = fields.date1[0];
            var date2 = fields.date2[0];
            
            var allcars = await get_complectation(date1, date2);

            res.render('search', {
                variables: allcars
            });
        } else {
            res.redirect('/');
        }
    });
});

async function get_complectation(date1, date2) {
    var sql_text = `select Description, EquimentId, Type from Детали_комплектации`;

    var connection = new sql.ConnectionPool({
        database: 'KDZ',
        server: 'localhost\\SQLEXPRESS',
        driver: 'msnodesqlv8',
        options: { trustedConnection:true }        
    });

    await connection.connect();

    var q_req = new sql.Request(connection);
    var arr_tasks = await q_req.query(sql_text);

    return arr_tasks.recordset;
}

router.post('/car/find', async function (req, res) {
    var form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
        if (!err) {
            var transmission = fields.transmission[0];
            var conditioner = fields.conditioner[0];
            var clas = fields.clas[0];
            var body = fields.body[0];
            var seat = fields.seat[0];

            var carlist = await get_cars(transmission, body, conditioner, seat, clas);

            res.render('carlist', {
                carlist: carlist
            });
        } else {
            res.redirect('/');
        }
    });
})

async function get_cars(transmission, body, conditioner, seat, clas)
{
    var sql_text = `declare @a as int
    declare @b as int
    declare @c as int
    declare @d as int
    declare @e as int

    set @a = (select top 1 EquimentId from Детали_комплектации where Description='Тип коробки' and Type = @коробка)
    set @b = (select top 1 EquimentId from Детали_комплектации where Description='Тип кузова' and Type = @кузов)
    set @c = (select top 1 EquimentId from Детали_комплектации where Description='Кондиционер' and Type = @кондиционер)
    set @d = (select top 1 EquimentId from Детали_комплектации where Description='Количество мест' and Type = @места)
    set @e = (select top 1 EquimentId from Детали_комплектации where Description='Класс автомобиля' and Type = @класс)

    select pivo.ModelName as Name from
    (
    select ModelName, [Тип коробки], [Тип кузова], [Кондиционер], [Количество мест], [Класс автомобиля]
    from
    (select m.ModelName, d.Description, d.EquimentId
    from Комплектация k join Модели m on k.ModelId = m.ModelId
					    join Детали_комплектации d on d.EquimentId = k.EquimentId) bas
    pivot
    (
	    max(EquimentId)
	    for Description in ([Тип коробки], [Тип кузова], [Кондиционер], [Количество мест], [Класс автомобиля])
    ) piv) as pivo
    where [Тип коробки]=@a and [Тип кузова]=@b and [Кондиционер]=@c and [Количество мест]=@d and [Класс автомобиля]=@e`;//последнюю строку доработать

    var connection = new sql.ConnectionPool({
        database: 'KDZ',
        server: 'localhost\\SQLEXPRESS',
        driver: 'msnodesqlv8',
        options: { trustedConnection: true }

    });

    await connection.connect();

    var q_req = new sql.Request(connection);
    var arr_tasks = await q_req
        .input("коробка", sql.NVarChar(100), transmission)
        .input("кузов", sql.NVarChar(100), body)
        .input("кондиционер", sql.NVarChar(100), conditioner)
        .input("места", sql.NVarChar(100), seat)
        .input("класс", sql.NVarChar(100), clas)
        .query(sql_text);

    return arr_tasks.recordset;
}

module.exports = router;
