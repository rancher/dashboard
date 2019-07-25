import { Database } from '@vuex-orm/core';
import Package from '@/models/Package';

const database = new Database();

database.register(Package);

export default database;
