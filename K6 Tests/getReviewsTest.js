import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '30s',
};

export default function () {
  for (let id = 998011; id < 1000011 ; id ++) {
    http.get(http.url`http://localhost:3000/reviews?product_id=${id}`);
  }
  sleep(0.001);
}