"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.getAllUsers = exports.getUserByEmail = exports.getUserById = exports.getUserByUsername = exports.createUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const createUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield db_1.default.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [user.username, user.email, user.password, user.role]);
    const insertId = result.insertId;
    return Object.assign(Object.assign({}, user), { id: insertId });
});
exports.createUser = createUser;
const getUserByUsername = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows;
    return users.length ? users[0] : null;
});
exports.getUserByUsername = getUserByUsername;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows;
    return users.length ? users[0] : null;
});
exports.getUserById = getUserById;
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows;
    return users.length ? users[0] : null;
});
exports.getUserByEmail = getUserByEmail;
// Get all users (admin only)
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.query('SELECT id, username, email, role, created_at, last_login FROM users');
    return rows;
});
exports.getAllUsers = getAllUsers;
// Update user role (admin only)
const updateUserRole = (id, role) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield db_1.default.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return result.affectedRows > 0;
});
exports.updateUserRole = updateUserRole;
