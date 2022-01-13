const {Storage} = require('@google-cloud/storage');
const fs = require('fs');
const fse = require('fs-extra');
const readline = require('readline');
const path = require('path');

const storage = new Storage();

const buildMetadata = (event, context) => {
  const metadata = {};
  metadata.eventId = context.eventId;
  metadata.eventType = context.eventType;
  metadata.bucket = event.bucket;
  metadata.name = event.name;
  metadata.metageneration = event.metageneration;
  metadata.timeCreated = event.timeCreated;
  metadata.updated = event.updated;
  return metadata;
};

const preBuildJob = (metadata) => {
  // /a6/8b/a68b412c4282555f15546cf6e1fc42893b7e07f271557ceb021821098dd66c1b/2021_11_25/3406/2817/job.log
  const fileSegments = metadata.name.split("/");
  const nbFileSegments = fileSegments.length;
  const job = {};
  job.rowData = "";
  job.rowNumber = 0;
  job.metadata = metadata;
  job.logFilePath = metadata.name;
  job.logFileName = fileSegments[nbFileSegments - 1];
  job.jobArtifactId = fileSegments[nbFileSegments - 2];
  job.jobId = fileSegments[nbFileSegments - 3];
  job.date = fileSegments[nbFileSegments - 4].replace(/_/g, "-");
  return job;
};

exports.logFile = async (event, context) => {
  const metadata = buildMetadata(event, context);   
  const job = preBuildJob(metadata);
 
  if (job.logFileName === "job.log") {
    const bucket = storage.bucket(event.bucket);
    const gsFile = bucket.file(event.name);

    const outputFilePath = `/tmp/${event.name}`;
    const outputDirectoryPath = path.dirname(outputFilePath);
  
    await fse.ensureDir(outputDirectoryPath);
    await gsFile.download({destination: outputFilePath});
  
    const outputFile = readline.createInterface({
        input: fs.createReadStream(outputFilePath),
        output: process.stdout,
        terminal: false
    });
  
    outputFile.on('line', (line) => {
      job.rowNumber++;
      job.rowData = line;
      console.log(JSON.stringify(job));
    });  
  } else {
    job.rowData = "Not a gitlab log file";
    console.log(JSON.stringify(job));
  }
};

