CREATE TABLE reviews(
  id integer GENERATED ALWAYS AS IDENTITY,
  product_id integer NOT NULL,
  rating integer NOT NULL,
  date_posted bigint NOT NULL,
  summary text NOT NULL,
  body text,
  recommend boolean,
  reported boolean,
  reviewer_name text,
  email text,
  response text,
  helpfulness integer,
  CONSTRAINT "Primary key" PRIMARY KEY(id)
);

CREATE TABLE "characteristics"(
  id integer GENERATED ALWAYS AS IDENTITY,
  product_id integer NOT NULL,
  "name" character varying(50),
  CONSTRAINT characteristics_pkey PRIMARY KEY(id)
);

CREATE TABLE characteristics_reviews(
  id integer GENERATED ALWAYS AS IDENTITY,
  characteristics_id integer,
  review_id integer,
  "value" integer
);

CREATE TABLE review_photos(
  id integer GENERATED ALWAYS AS IDENTITY,
  review_id integer NOT NULL,
  url character varying(200)
);

CREATE TABLE products(
  id integer NOT NULL UNIQUE
);

ALTER TABLE characteristics_reviews
  ADD CONSTRAINT characteristics_reviews_review_id_fkey
    FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE No action
      ON UPDATE No action;

ALTER TABLE characteristics_reviews
  ADD CONSTRAINT characteristics_reviews_characteristics_id_fkey
    FOREIGN KEY (characteristics_id) REFERENCES "characteristics" (id);

ALTER TABLE review_photos
  ADD CONSTRAINT review_photos_reviews_id_fkey
    FOREIGN KEY (review_id) REFERENCES reviews (id);

ALTER TABLE review_photos
  ADD CONSTRAINT review_photos_id_pkey
    PRIMARY KEY (id);

ALTER TABLE characteristics_reviews
  ADD CONSTRAINT characteristics_id_pkey
    PRIMARY KEY (id);

COPY reviews
FROM '/Users/cameronestep/Desktop/system-design-capstone/db/reviews.csv'
DELIMITER ','
CSV HEADER;

COPY characteristics
FROM '/Users/cameronestep/Desktop/system-design-capstone/db/characteristics.csv'
DELIMITER ','
CSV HEADER;

COPY characteristics_reviews
FROM '/Users/cameronestep/Desktop/system-design-capstone/db/characteristic_reviews.csv'
DELIMITER ','
CSV HEADER;

COPY review_photos
FROM '/Users/cameronestep/Desktop/system-design-capstone/db/reviews_photos.csv'
DELIMITER ','
CSV HEADER;

INSERT INTO products(id)
SELECT DISTINCT product_id
FROM reviews;
ON CONFLICT (id)
DO NOTHING;

INSERT INTO products(id)
SELECT DISTINCT product_id
FROM characteristics
ON CONFLICT (id)
DO NOTHING;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_products_id_fkey
    FOREIGN KEY (product_id) REFERENCES products (id);

ALTER TABLE characteristics
  ADD CONSTRAINT characteristics_products_id_fkey
    FOREIGN KEY (product_id) REFERENCES products (id);

ALTER TABLE products
  ADD CONSTRAINT product_id_pkey
  PRIMARY KEY (id);

CREATE INDEX reviews_product_index ON reviews (product_id);
CREATE INDEX photos_review_index ON review_photos (review_id);
CREATE INDEX characteristics_prod_index ON characteristics (product_id);
CREATE INDEX cr_index ON characteristics_reviews (characteristics_id);
CREATE INDEX cr_index_alt ON characteristics_reviews (review_id);

SELECT setval(pg_get_serial_sequence('reviews', 'id'), coalesce(MAX(id), 1))
FROM reviews;

SELECT setval(pg_get_serial_sequence('characteristics', 'id'), coalesce(MAX(id), 1))
FROM characteristics;

SELECT setval(pg_get_serial_sequence('characteristics_reviews', 'id'), coalesce(MAX(id), 1))
FROM characteristics_reviews;

SELECT setval(pg_get_serial_sequence('review_photos', 'id'), coalesce(MAX(id), 1))
FROM review_photos;

\c reviews_service
DROP DATABASE review_service;
CREATE DATABASE review_service;
\c review_service;


DROP DATABASE reviews_service;
CREATE DATABASE reviews_service;
\c reviews_service;


--/reviews (Complete / Optimized)
EXPLAIN ANALYZE
SELECT reviews.id, reviews.rating, reviews.summary, reviews.recommend, reviews.response, reviews.body,reviews.date_posted, reviews.reviewer_name, reviews.helpfulness, json_build_object('id', review_photos.id, 'url', review_photos.url) AS photos
FROM products
JOIN reviews
ON products.id = reviews.product_id
LEFT JOIN review_photos
ON reviews.id = review_photos.review_id
WHERE products.id = 2
AND reviews.reported = false
GROUP BY reviews.id, review_photos.id;

--reviews/meta (Complete / Optimized)
EXPLAIN ANALYZE
SELECT json_build_object('ratings', (SELECT json_build_object(
  '1', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = 2 AND r.rating = 1),
  '2', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = 2  AND r.rating = 2),
  '3', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = 2 AND r.rating = 3),
  '4', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = 2 AND r.rating = 4),
  '5', (SELECT COUNT(*) FROM reviews r WHERE r.product_id = 2 AND r.rating = 5)
))) as ratings
, r.recommend,
json_build_object('name', c.name, 'value',  cr.value, 'id', cr.characteristics_id) as characteristics
FROM characteristics_reviews cr
JOIN characteristics c
ON cr.characteristics_id = c.id
JOIN reviews r
ON cr.review_id = r.id
AND r.product_id = 37413
GROUP BY r.id, cr.review_id, c.name, cr.value, cr.characteristics_id
ORDER BY r.id, cr.characteristics_id;
