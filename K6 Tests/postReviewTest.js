import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '10s',
}

export default function () {
  const data ={
    "rating": 5,
    "summary": "I have nothing at all to say about these.",
    "body": "this body is truly terrible",
    "recommend": 'true',
    "name": "Cam lastName",
    "email": "camlastName@gmail.com",
    "photos": ["testurl1", "testurl2", "testurl3"],
    "characteristics": {
        "14": 3,
        "15": 5,
        "16": 3
    }
  };

  let url = `http://localhost:3000/reviews?product_id=37413`
  let res = http.post(url, {data}, { headers: { 'Content-Type': 'application/json' } })


  sleep(0.001);
}