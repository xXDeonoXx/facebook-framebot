const config = require('./config');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const ffmpegExtracter = require('ffmpeg-extract-frames');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios').default;
const imgur = require('imgur');

process.env['PATH'] += config.selenium_path;

async function postImage(image) {
  var options = new chrome.Options();
  options.addArguments('--disable-notifications');
  options.addArguments('--headless');

  const driver = await new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  const actions = driver.actions({ bridge: true });

  await driver.get('https://www.facebook.com');
  await driver.manage().setTimeouts({ implicit: 5000 });

  let email = await driver.findElement(webdriver.By.name('email'));
  await email.clear();
  await email.sendKeys(config.username);

  let password = await driver.findElement(webdriver.By.name('pass'));
  await password.clear();
  await password.sendKeys(config.password);

  await actions
    .sendKeys(webdriver.Key.TAB, webdriver.Key.TAB, webdriver.Key.ENTER)
    .perform();

  // let loginbutton = driver.findElement(
  //   webdriver.By.xpath(`//*[@id="u_0_d_Zd"]`)
  // );
  // await loginbutton.click();

  await driver.manage().setTimeouts({ implicit: 5000 });

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });

  await driver.get(config.page_url);
  console.log('page loaded');

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });

  // let openPub = driver.findElement(webdriver.By.linkText('Adicionar fotos'));
  let openPub = await driver.findElement(
    webdriver.By.xpath(`.//div[@aria-label="Criar publicação"]`)
  );
  await openPub.click();
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 3000);
  });
  let input = await driver.findElement(
    webdriver.By.xpath(
      './/input[@accept="image/*,image/heif,image/heic,video/*,video/mp4,video/x-m4v,video/x-matroska,.mkv"]'
    )
  );
  input.sendKeys(image.path);

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 20000);
  });
  let currentElement = await driver.switchTo().activeElement();
  currentElement.sendKeys(image.description);

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });

  await actions
    .sendKeys(
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.TAB,
      webdriver.Key.ENTER
    )
    .perform();

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 30000);
  });
  driver.quit();
}

async function getFrame() {
  const movies = config.movies;

  const movie = movies[Math.floor(Math.random() * movies.length)];

  console.log(movie);

  var length = await getVideoLength(movie);

  const offSet = Math.floor(Math.random() * length) * 1000;
  console.log(msToTime(offSet));

  await ffmpegExtracter({
    input: `${config.movies_folder}${movie}`,
    output: `${config.movies_folder}screnshot.png`,
    offsets: [offSet],
  });

  let description = `${movie.split('.')[0]}: ${msToTime(offSet)}`;

  return {
    description: description,
    path: `${config.movies_folder}screnshot.png`,
  };
}

async function getVideoLength(movie) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(`${config.movies_folder}${movie}`, function (err, metadata) {
      setTimeout(() => {
        resolve(metadata.format.duration);
      }, 1000);
    });
  });
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return hours + ':' + minutes + ':' + seconds;
}

async function execute() {
  try {
    const image = await getFrame();
    await postImage(image);

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
    return;
  } catch (error) {
    console.log(error);
    execute();
  }
}

(async function main() {
  console.log(config);
  execute();
  console.log('awaiting...');
  setInterval(() => {
    execute();
    console.log('awaiting...');
  }, 60000 * 30);
})();
