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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var bcrypt_1 = __importDefault(require("bcrypt"));
var pg_1 = require("pg");
var dotenv_1 = __importDefault(require("dotenv"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
var app = express_1.default();
var port = 3000;
var pool = new pg_1.Pool({
    user: process.env.USER,
    host: process.env.HOST,
    password: process.env.PASSWORD,
    port: 5432,
    database: process.env.DATABASE,
});
pool.query('SELECT NOW()', function (err, res) {
    if (err) {
        console.error('Error connecting to the database', err.stack);
    }
    else {
        console.log('Connected to the database at', res.rows[0].now);
    }
});
exports.getuser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var query, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = 'SELECT * FROM users';
                return [4 /*yield*/, pool.query(query)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows];
        }
    });
}); };
exports.createStudent = function (student) { return __awaiter(void 0, void 0, void 0, function () {
    var query, values, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = 'INSERT INTO student (name, email, password,total_marks,exam_type) VALUES($1, $2, $3, $4, $5) RETURNING *';
                values = [student.name, student.email, student.password, student.total_marks, student.exam_type];
                return [4 /*yield*/, pool.query(query, values)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows[0]];
        }
    });
}); };
// Register a new user
app.post('/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, name_1, email, existingUser, existingEmail, hashedPassword, result, user, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, username = _a.username, password = _a.password, name_1 = _a.name, email = _a.email;
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE username = $1', [username])];
            case 1:
                existingUser = _b.sent();
                if (existingUser.rows.length > 0) {
                    return [2 /*return*/, res.status(409).json({ error: 'Username is already used' })];
                }
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE email = $1', [email])];
            case 2:
                existingEmail = _b.sent();
                if (existingEmail.rows.length > 0) {
                    return [2 /*return*/, res.status(409).json({ error: 'Email is already registered' })];
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 3:
                hashedPassword = _b.sent();
                return [4 /*yield*/, pool.query('INSERT INTO users (username, password, name, email) VALUES ($1, $2, $3, $4) RETURNING *', [username, hashedPassword, name_1, email])];
            case 4:
                result = _b.sent();
                user = result.rows[0];
                res.status(201).json('Register Successful');
                return [3 /*break*/, 6];
            case 5:
                err_1 = _b.sent();
                console.error(err_1);
                res.status(500).json({ error: 'Something went wrong' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Login as an existing user
app.get("/users", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, exports.getuser()];
            case 1:
                user = _a.sent();
                res.json({ user: user });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.log(error_1);
                res.status(500).send("Internal server error");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, result, user, _b, token, err_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE username = $1', [username])];
            case 1:
                result = _c.sent();
                user = result.rows[0];
                _b = user;
                if (!_b) return [3 /*break*/, 3];
                return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
            case 2:
                _b = (_c.sent());
                _c.label = 3;
            case 3:
                if (_b) {
                    token = jsonwebtoken_1.default.sign({ id: user.id }, 'your-secret-key');
                    res.json({ token: token });
                }
                else {
                    res.status(400).json({ error: 'Invalid username or password' });
                }
                return [3 /*break*/, 5];
            case 4:
                err_2 = _c.sent();
                console.error(err_2);
                res.status(500).json({ error: 'Something went wrong' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// student login
app.get("/student/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, result, students, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                query = 'SELECT * FROM students';
                return [4 /*yield*/, pool.query(query)];
            case 1:
                result = _a.sent();
                students = result.rows;
                res.json({ students: students });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.log(error_2);
                res.status(500).send("Internal server error");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.listen(port, function () {
    console.log("Server running on port:", port);
});
