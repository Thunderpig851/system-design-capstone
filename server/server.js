require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const db = require('../db/index.js')

app.use(express.static('dist'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/loaderio-5486dcdddad9fa34f74d5798ce75a8f3', (req, res) => {
  res.sendFile(path.join(__dirname, 'loaderio-5486dcdddad9fa34f74d5798ce75a8f3.txt'));
});

//Complete -sub 15ms
app.put('/reviews/report', (req, res) => {

  const review_id = req.query.review_id;

  db.query('UPDATE reviews SET reported = true WHERE id = $1', [review_id])
      .then(result => {
        res.sendStatus(204);
      })
      .catch(err => {
        console.log(err.stack);
        res.sendStatus(500);
      })
});
//Complete -sub 15ms
app.put('/reviews/helpful', (req, res) => {

  const review_id = req.query.review_id;

  db.query('UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = $1', [review_id])
      .then(result => {
        res.sendStatus(204);
      })
      .catch(err => {
        res.sendStatus(500);
      });
});

//Complete - sub 30ms
app.get('/reviews', (req, res) => {

  const page = req.query.page || 1;
  const count = req.query.count || 20;
  const product_id = req.query.product_id;
  const sort = req.query.sort || 'helpful';

  db.query(`SELECT reviews.id AS review_id,
    reviews.rating,
    reviews.summary,
    reviews.recommend,
    reviews.response,
    reviews.body,
    reviews.date_posted as date,
    reviews.reviewer_name,
    reviews.helpfulness,
    json_build_object('id', review_photos.id, 'url', review_photos.url) AS photos
    FROM products
    JOIN reviews
    ON products.id = reviews.product_id
    LEFT JOIN review_photos ON reviews.id = review_photos.review_id
    WHERE products.id = $1 AND reviews.reported = false
    GROUP BY reviews.id, review_photos.id
    LIMIT $2`, [product_id, count])
      .then(result => {

        let data = result.rows;
        data.forEach(record => record.date = new Date(Number(record.date)));

        let model = {
          'product': product_id,
          'page': page,
          'count': count,
          'results': [
            ...data
          ]
        }
        res.json(model);
      })
      .catch(err => {
        res.sendStatus(500);
      })
});

//Complete - sub 50ms
app.get('/reviews/meta', (req, res) => {

  const product_id = req.query.product_id;

  db.query(`SELECT json_build_object('ratings', (SELECT json_build_object(
    '1', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = $1 AND r.rating = 1),
    '2', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = $1  AND r.rating = 2),
    '3', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = $1 AND r.rating = 3),
    '4', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = $1 AND r.rating = 4),
    '5', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = $1 AND r.rating = 5)
  ))) as ratings
  , r.recommend,
  json_build_object('name', c.name, 'value',  cr.value, 'id', cr.characteristics_id) as characteristics
  FROM characteristics_reviews cr
  JOIN characteristics c
  ON cr.characteristics_id = c.id
  JOIN reviews r
  ON cr.review_id = r.id
  AND r.product_id = $1
  GROUP BY r.id, cr.review_id, c.name, cr.value, cr.characteristics_id
  ORDER BY r.id, cr.characteristics_id`, [product_id])
    .then(results => {

      const data = results.rows;
      const ratings = data[0].ratings.ratings;

      const model = {
        'product_id': product_id,
        'ratings': {
          ratings
        },
        'recommended': {
          'true': 0,
          'false': 0
        },
        'characteristics': {

        }
      };

      for (let i = 0; i < data.length; i++) {
        if (data[i].recommend) {
          model['recommended']['true'] ++;
        } else {
          model['recommended']['false'] ++;
        }
        if (data[i].characteristics && !model.characteristics.name) {
          model.characteristics[data[i].characteristics.name] = {
            'id': data[i].characteristics.id,
            'value': 0
          };
        }
      };

      for (let i = 0; i < data.length; i++) {
        if (data[i].characteristics.id === model.characteristics[data[i].characteristics.name].id) {
          model.characteristics[data[i].characteristics.name].value = model.characteristics[data[i].characteristics.name].value + data[i].characteristics.value;
        }
      };

      for (let i = 0; i < Object.keys(model.characteristics).length; i++) {
        let divider = data.length / Object.keys(model.characteristics).length;
        model.characteristics[data[i].characteristics.name].value = model.characteristics[data[i].characteristics.name].value / divider;
      };

      res.send(model);
    })
    .catch(err => {
      res.sendStatus(500);
    })
});

app.post('/reviews', (req, res) => {

  const product_id = req.query.product_id;
  const rating = req.body.rating;
  const date = + new Date();
  const summary = req.body.summary;
  const body = req.body.body;
  const recommend = req.body.recommend;
  const reported = false;
  const name = req.body.name;
  const email = req.body.email;
  const response = null;
  const helpfulness =0;
  const photos = req.body.photos;
  const characteristics = req.body.characteristics;

  db.query(`INSERT INTO reviews(product_id,
                                rating,
                                date_posted,
                                summary,
                                body,
                                recommend,
                                reported,
                                reviewer_name,
                                email,
                                response,
                                helpfulness)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id as review_id`,
            [product_id, rating, date, summary, body, recommend, reported, name, email, response, helpfulness])
    .then(result => {

      const review_id = result.rows[0].review_id;
      var photoValues = photos.map(url => {
        return `(${review_id}, '${url}')`
      }).join(',');

      db.query(`INSERT INTO review_photos(review_id, url) VALUES ${photoValues}`)
        .then(result => {

          let payload = ''
          let values = Object.entries(characteristics)
          for (let i = 0; i < values.length; i++) {
            values[i].push(review_id);
            payload +=`(${values[i]}), `
          }
          payload = payload.slice(0, payload.length - 2);

          db.query(`INSERT INTO characteristics_reviews(characteristics_id, review_id, value) VALUES${payload}`)
          res.sendStatus(201);
        })
    })
    .catch(err => {
      res.sendStatus(500);
    });
});


app.listen(process.env.PORT, () =>
  console.log(`Server listening at hhttp://ec2-3-131-26-88.us-east-2.compute.amazonaws.com::${process.env.PORT}`)
);