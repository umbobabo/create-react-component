import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
// Visual tests folder.
const visualSnapshotDirectory = "./__visual__reference";
const visualTestDirectory = "./__visual__test";


export default async function takeAndCompareScreenshot(page, filePrefix, route) {
  // Run only once.
  await createVisualTestFolders();
  // And its wide screen/small screen subdirectories.
  if (!fs.existsSync(`${visualTestDirectory}/${filePrefix}`))
    fs.mkdirSync(`${visualTestDirectory}/${filePrefix}`);
  // If you didn't specify a file, use the name of the route.
  let fileName = createFilePath(filePrefix, route);
  await captureReferences(page, filePrefix, route);
  // Start the browser, go to that page, and take a screenshot.
  const testImage = `${visualTestDirectory}/${fileName}.png`;
  await page.screenshot({ path: testImage });

  // Test to see if it's right.
  return compareScreenshots(fileName);
}
function compareScreenshots(fileName) {
  return new Promise((resolve, reject) => {
    let filesRead = 0;
    const testImage = fs
      .createReadStream(`${visualTestDirectory}/${fileName}.png`)
      .pipe(new PNG())
      .on("parsed", doneReading);
    const referenceImage = fs
      .createReadStream(`${visualSnapshotDirectory}/${fileName}.png`)
      .pipe(new PNG())
      .on("parsed", doneReading);

    function doneReading() {
      // Wait until both files are read.
      if (++filesRead < 2) return;

      // The files should be the same size.
      if (testImage.width !== referenceImage.width) {
        reject("Images should have the same width");
      }
      if (testImage.height !== referenceImage.height) {
        reject("Images should have the same height");
      }

      // Do the visual diff.
      const diff = new PNG({
        width: testImage.width,
        height: referenceImage.height
      });
      const numDiffPixels = pixelmatch(
        testImage.data,
        referenceImage.data,
        diff.data,
        testImage.width,
        testImage.height,
        {
          threshold: 0.1
        }
      );

      // The files should look the same.
      if (numDiffPixels !== 0) {
        const diffImage = `${visualTestDirectory}/${fileName}-diff.png`;
        diff.pack().pipe(fs.createWriteStream(diffImage));
        reject(`Images seems to be different, please check: ${diffImage}`);
      } else {
        resolve();
      }
    }
  });
}

function createFilePath(filePrefix, route = "index") {
  return `${filePrefix}/${route}`;
}

async function captureReferences(page, filePrefix, route) {
  const fileName = createFilePath(filePrefix, route);
  const testImage = `${visualSnapshotDirectory}/${fileName}.png`;
  if (!fs.existsSync(testImage)) {
    if (!fs.existsSync(`${visualSnapshotDirectory}/${filePrefix}`)) {
      fs.mkdirSync(`${visualSnapshotDirectory}/${filePrefix}`);
    }
    await page.screenshot({
      path: testImage
    });
  }
}

async function createVisualTestFolders() {
  if (!fs.existsSync(visualSnapshotDirectory)) {
    fs.mkdirSync(visualSnapshotDirectory);
  }
  if (!fs.existsSync(visualTestDirectory)) {
    fs.mkdirSync(visualTestDirectory);
  }
}
