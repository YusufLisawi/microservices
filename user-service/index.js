const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;
const secretKey = "abc0011";

// Connect to MongoDB
mongoose
    .connect(`mongodb://localhost:27017/microservices`, { useNewUrlParser: true })
    .then(() => console.log("Connection to MongoDB successful"))
    .catch((error) => console.log('Error ' + error));

// Define User schema
const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

const User = mongoose.model("User", userSchema);

// Middleware for parsing request bodies
app.use(bodyParser.json());

// User registration endpoint
app.post("/register", async (req, res) => {
	const { username, password } = req.body;

	// Create a new user
	const userExists = await User.findOne({ email });
	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
	}
	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	// Create User
	const user = await User.create({
		username,
		password: hashedPassword,
	});

	if (user) {
		res.status(201).json({
			_id: user._id,
			username: user.username,
		});
	} else {
		res.status(400);
		throw new Error("Invalid user data");
	}
});

// User login endpoint
app.post("/login", async (req, res) => {
	const { username, password } = req.body;

	const user = await User.findOne({ username });

	if (user && (await bcrypt.compare(password, user.password))) {
		const token = jwt.sign({ id: user._id }, secretKey);
		res.status(200).json({ token });
	} else {
		res.status(400).json({ message: "Invalid username or password" });
	}
});

// Start the Express server
app.listen(port, () => {
	console.log(`User Service running on port ${port}`);
});
