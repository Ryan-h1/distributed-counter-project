'use strict';
var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
  event.Records.forEach((record) => {
    console.log('Stream record: ', JSON.stringify(record, null, 2));
    
    // Check if the item is a Service by examining the sort key
    const sortKey = record.dynamodb.Keys.SK.S;
    if (sortKey && sortKey.startsWith('SERVICE#')) {
      if (record.eventName == 'INSERT') {
        const newService = record.dynamodb.NewImage;
        if (newService) {
          console.log('New Service Created');
        }
      }
    }
  });
  callback(null, `Successfully processed ${event.Records.length} records.`);
};
