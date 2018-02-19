import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import puppeteer from "puppeteer";
import takeAndCompareScreenshot from "./visual-compare";

const pageToTestURL = "http://localhost:3000";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

let page;
let browser;
const width = 1920;
const height = 1080;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${width},${height}`]
  });
  page = await browser.newPage();
  await page.setViewport({ width, height });
  // TODO. Run the test server here.
});

describe("End-to-end tests", () => {
  /* End-to-end tests with Puppeteer */
  test(
    "Can be edited",
    async () => {
      await page.goto(pageToTestURL);
      await page.waitForSelector("[type=email]");
      await page.click("input[type=email]");
      await page.type("input[type=email]", "Just something");
      const textInInput = await page.$eval("[type=email]", el => el.value);
      expect(textInInput).toEqual("Just something");
    },
    16000
  );
});

describe("Visual tests", () => {
  /* Visual unit tests with Puppeteer + Pixelmatch */
  describe("wide screen", function() {
    beforeEach(async function() {
      return page.setViewport({
        width: 800,
        height: 600
      });
    });
    test("default state", async function() {
      await page.goto(pageToTestURL);
      return takeAndCompareScreenshot(page, "wide");
    });
    test("hover state", async function() {
      await page.goto(pageToTestURL);
      await page.hover("input[type=email]");
      return takeAndCompareScreenshot(page, "wide", "hover");
    });
  });
  describe("narrow screen", function() {
    beforeEach(async function() {
      return page.setViewport({
        width: 375,
        height: 667
      });
    });
    test("default state", async function() {
      await page.goto(pageToTestURL);
      return takeAndCompareScreenshot(page, "narrow");
    });
    test("hover state", async function() {
      await page.goto(pageToTestURL);
      await page.hover("input[type=email]");
      return takeAndCompareScreenshot(page, "narrow", "hover");
    });
    // And your other routes, 404, etc.
  });
});

afterAll(() => {
  browser.close();
  // TODO. Close the test server here.
});
