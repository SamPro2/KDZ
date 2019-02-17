'use strict';
var express = require('express');
var router = express.Router();
var sql = require('mssql/msnodesqlv8');
var multiparty = require('multiparty');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

router.get('/search', async function (req, res) {

    var allcars = await get_complectation();

    res.render('search', {
        variables: allcars });
});

async function get_complectation() {
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

router.get('/car/new', async function (req, res) {
    res.render('carlist');
})

router.post('/car/new', async function (req, res) {
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
})

module.exports = router;
