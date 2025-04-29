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
exports.getTrashReportById = exports.getAllTrashReports = exports.createTrashReport = void 0;
const db_1 = __importDefault(require("../config/db"));
const createTrashReport = (trashReport) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield db_1.default.execute('INSERT INTO trash_reports (photo_url, latitude, longitude, description) VALUES (?, ?, ?, ?)', [trashReport.photoUrl, trashReport.latitude, trashReport.longitude, trashReport.description || null]);
    const insertId = result.insertId;
    return Object.assign(Object.assign({}, trashReport), { id: insertId });
});
exports.createTrashReport = createTrashReport;
const getAllTrashReports = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.query('SELECT * FROM trash_reports ORDER BY created_at DESC');
    return rows;
});
exports.getAllTrashReports = getAllTrashReports;
const getTrashReportById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute('SELECT * FROM trash_reports WHERE id = ?', [id]);
    const reports = rows;
    return reports.length ? reports[0] : null;
});
exports.getTrashReportById = getTrashReportById;
