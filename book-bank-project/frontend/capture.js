import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const imgDir = path.join(__dirname, '..', '..', 'Documentation');

  try {
    page.on('dialog', async dialog => { await dialog.accept(); });
    
    console.log('Capturing Login...');
    await page.goto('http://127.0.0.1:5173');
    await page.waitForSelector('h2');
    await page.screenshot({ path: path.join(imgDir, '1_login.png') });
    
    console.log('Capturing Student Dashboard...');
    const buttons = await page.$$('button');
    await buttons[0].click(); // click Student
    await new Promise(r => setTimeout(r, 500));
    
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForNavigation();
    await page.waitForSelector('.glass-card');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(imgDir, '2_student_search.png') });
    
    console.log('Capturing Student Request...');
    const reqBtns = await page.$$('.btn-primary');
    for (let b of reqBtns) {
      let text = await page.evaluate(el => el.textContent, b);
      if (text === 'Request Book') {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.screenshot({ path: path.join(imgDir, '3_student_requested.png') });
    
    console.log('Capturing Staff Log...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://127.0.0.1:5173');
    await page.waitForSelector('h2');
    const bts = await page.$$('button');
    await bts[1].click(); // click Staff
    await new Promise(r => setTimeout(r, 500));
    
    const staffSubmit = await page.$('button[type="submit"]');
    await staffSubmit.click();
    await page.waitForNavigation();
    await new Promise(r => setTimeout(r, 1500)); 
    await page.screenshot({ path: path.join(imgDir, '4_staff_approval.png') });
    
    // 6. Student views deadline
    console.log('Capturing final Approved return date...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://127.0.0.1:5173');
    await page.waitForSelector('h2');
    const stuBtns = await page.$$('button');
    await stuBtns[0].click(); // Student
    await new Promise(r => setTimeout(r, 500));
    const stuSubmit = await page.$('button[type="submit"]');
    await stuSubmit.click();
    await page.waitForNavigation();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(imgDir, '6_student_due_date.png') });
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

capture();
