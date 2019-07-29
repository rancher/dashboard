import { Database } from '@vuex-orm/core';
import Schema from '@/models/Schema';

const database = new Database();

database.register(Schema);

export default database;
