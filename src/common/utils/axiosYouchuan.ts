import axios from 'axios';

import { config } from '@/common/config';

const youchuanAxios = axios.create({
  baseURL: config.youchuan.baseUrl || 'https://ali.youchuan.cn',
  timeout: config.youchuan.timeout,
});

export default youchuanAxios;

