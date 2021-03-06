fs = require('fs');
var request = require('request');
var liner = require('./liner');
var zips = fs.createReadStream('assets/zipcode.csv');

opts = {
	org: 'apigee',
	app: 'sandbox',
	collection: 'zipcodes'
}

zips.pipe(liner)
liner.on('readable', function() {
	var line
	while (line = liner.read()) {
		if (line) {
			var fields = CSVToArray(line, ",")[0];
			
			var reqBody = {
				name: fields[0],
				zipcode: fields[0],
				cityname: fields[1],
				state: fields[2],
				location: {
					latitude: parseFloat(fields[3]),
					longitude: parseFloat(fields[4])
				}
			}

			reqMap = {
				method: 'PUT',
				url: 'https://usergrid-e2e-prod.e2e.apigee.net/appservices-2-1/'+opts.org+'/'+opts.app+'/' +opts.collection+'/' + fields[0],
				body: JSON.stringify(reqBody),
				headers: {
					"Content-Type": "application/json"
				}
			}

			request(reqMap, function(error, response, body) {
				console.log('response code is: ' + response.statusCode)
			})
		}
	}
})

function CSVToArray(strData, strDelimiter) {
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
	);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [
		[]
	];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec(strData)) {

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[1];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
		) {

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push([]);

		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[2]) {

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[2].replace(
				new RegExp("\"\"", "g"),
				"\""
			);

		} else {

			// We found a non-quoted value.
			strMatchedValue = arrMatches[3];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[arrData.length - 1].push(strMatchedValue);
	}

	// Return the parsed data.
	return (arrData);
}

