import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  for (let id = 4998011; id < 5000011 ; id ++) {
    http.put(http.url`http://localhost:3000/reviews/report?review_id=${id}`);
  }
  sleep(0.001);
}