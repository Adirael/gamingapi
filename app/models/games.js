var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema ({
	name: {
		type: String,
    unique: true,
    required: true
	},
  platform: {
    type: String,
    unique: false,
    required: true
  },
  cover: {
    type: String,
    unique: false,
    required: true
  },
});

module.exports = mongoose.model('Game', gameSchema);