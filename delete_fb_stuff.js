/*****
 *
 * FB Delete
 * Deletes various Facebook content by page scraping the mbasic facebook page
 * 
 *
 * *****/


'use strict';

const puppeteer = require('puppeteer');

var page;
var deleteCount =0;
var debug;
async function main(username,password,categories,years,months, twofactor, headless) {

  if (!headless) {
        headless = false;
  }

  const browser = await puppeteer.launch({
    headless: headless,
    slowMo: 50 //you don't want to go too fast otherwise you might trip a recaptcha on Facebook's end.
  });
  var pages = await browser.pages();
  page = pages[0];

  await page.goto('https://mbasic.facebook.com/'); //mbasic facebook I think is the facebook designed for non-smartphone phones (feature phones). It's easier to crawl than the mainstream FB.
  await page.$eval('input[id=m_login_email]', (el, user) => el.value = user, username);
  await page.$eval('input[name=pass]', ((el, pass) => el.value = pass), password);
  await page.$eval('input[name=login]', button => button.click());


    //check to see if we hit two factor auth
   if (await page.$('input[name=approvals_code]')) {

        //if we got here but they forgot to pass in two-factor
        if (!twofactor || twofactor == "") {
            
        var error_message = "You didn't pass in a two-factor number, but your account requires it. Please pass one in, or disable two-factor on your account, and try again."
            console.log(error_message);
            await browser.close();
            return {"error" :1, "message": error_message};
        }

        await page.focus('#approvals_code')
        await page.$eval('#approvals_code', (el, value) => el.value = value, twofactor);
        await page.$eval('input[id=checkpointSubmitButton-actual-button]', button => button.click());

       //the code worked.
        if (await page.$('input[value=Continue]')) {
            await page.$eval('input[value=Continue]', button => button.click());

            //if facebook locked the account, we need to tell it that things are fine.
            let review_login_check = await page.evaluate(() => {
                let check = document.getElementById("checkpoint_title");
                return check;
            });
            if (review_login_check) {
                await page.$eval('input[id=checkpointSubmitButton-actual-button]', button => button.click()); //click the continue button
                await page.$eval('input[id=checkpointSubmitButton-actual-button]', button => button.click()); //click the `this was me` button
                await page.$eval('input[id=checkpointSubmitButton-actual-button]', button => button.click()); //click the `continue` button
            }

        }
        else {

            var pageTitle = await page.title();

            var error_message = "The two-factor you passed in didn't work. Try again.";
            if (pageTitle == "Too Many Login Attempts") {
                error_message = "Looks like you have been logging in too many times. FB has temporarily blocked you. Please try again later.";
            }

            console.log(error_message);
            await browser.close();
            return {"error" :1, "message": error_message};
        }

    }
//check to see if we didn't log in for some reason.
//like if user put in wrong password or an old one.
    else if (await page.$('input[name=login]')) {
        console.log("That login info didn't work. Try again!");
        await browser.close();
        return {"error" :1, "message": "That login info didn't work. Try again!"};
    }


    var return_object = {};
    try {
      return_object = await next(categories, years, months);
    }
    catch(err) {
        return_object = {"error": 1, "message": err}; 
    }

    //close out browser when we are done
    await browser.close();

    return return_object;
}

async function next(categories, years, months) {

      await followLinkByContent('Profile');
      await followLinkByContent('Activity Log');
      await followLinkByContent('Filter');
      for (let i in categories) {
        console.log("Deleting category " + categories[i]);
        await followLinkByContent(categories[i]);
        for (let j in years) {
          console.log("In year " + years[j]);
          try {

            var d = new Date();
            var current_year = d.getFullYear();
            if (years[i] == current_year) {
                await followLinkByContent('This Month');
            }
            else {
                await followLinkByContent(years[j]);
            }
            await deleteYear(years[j], months);
          } catch(e) {
            console.log(`Year ${years[j]} not found.`, e);
          }
        }
        await followLinkByContent(categories[i]);
      }

    return {success: "1", message: "Done! "+ "I deleted "+ deleteCount + " items from your account!"};
}

async function deletePosts(month, year) {
  // get all "allactivity/delete" and "allactivity/removecontent" links on page
        var deleteLinks = await page.evaluate(() => { //get the delete links we have found on this page BEFORE hitting more button if it exists.
            var links = [];
            const deleteElements = document.querySelectorAll('a[href*="allactivity/delete"]');
            const removeElements = document.querySelectorAll('a[href*="allactivity/removecontent"]');
            const hideElements = document.querySelectorAll('a[href*="allactivity/visibility"]');
            for (const el of deleteElements) {
                links.push({link:el.href, seen:0});
            }
            for (const el of removeElements) {
                links.push({link:el.href, seen:0});
            }
            for (const el of hideElements) {
                links.push({link:el.href, seen:0});
            }
            return links;
        });
        

    var found_more_link;//if defined, this lets the program know that there are more links to delete for the given month.
    //and we need to run the function recursively.

      for (let i = 0; i < deleteLinks.length; i++) {
        
        //make sure we don't have more to load if this is the last item on the list:
        if (deleteLinks[deleteLinks.length -1] == deleteLinks[i]) {
            //find the load more link
            var text = 'Load more from';
            found_more_link = await page.evaluate((text) => {
                const strings = []
                const elements = document.querySelectorAll('a');
                for (let el of elements) {
                    var innerText = el.innerText.trim();
                    var regex = new RegExp( text, 'i' );
                    strings.push({text: innerText, link: el.href});
                    if (innerText.match(regex)) {
                        return el.href;
                    }
                  }
                    return; //return nothing if nothing found.
          }, text);

        }
            //delete if we haven't seen this link before.
            if (deleteLinks[i].seen ==0) {
                deleteLinks[i].seen = 1;
                if (!debug) {
                    await page.goto(deleteLinks[i].link);//deletes the post!
                }
                deleteCount = deleteCount + 1;
                if (debug) {
                    console.log("Would have deleted item number " + deleteCount);
                }
            }

      }

    //if we found the load more link, means we still gots deleting to do on the month. keep going.
      if (found_more_link) {
        if (debug) {
            await page.goto(found_more_link); //click on the more link. otherwise, we're stuck in a recursive loop if we aren't deleting posts. :)
        }
        else {
            await deletePosts(month, year);
        }
      }

}


async function getMonthLinks(year, selected_months) {
    var monthLinks = await page.evaluate((year, selected_months) => {
    var months = ["January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"];
    var links = [];
    var d = new Date();
    var current_month = months[d.getMonth()];
    var current_year = d.getFullYear();
    const elements = document.querySelectorAll('a');
    for (let el of elements) {
      for (let i = 0; i < months.length; i++) {
        if (!selected_months[months[i]]) {//if we reached a month that the user doesn't want, skip.
            continue;
        }
        if (months[i] == current_month && year == current_year) { //the current year and month section is listed as This Month
            if (el.innerText == 'This Month') {
              links.push({link: el.href, name: months[i]});
            }
        }
        else if (months[i] + " " + year === el.innerText) {
              links.push({link: el.href, name: months[i]});
        }
      }
    }
    return links;
  }, year, selected_months);
  return monthLinks;
}

async function followLinkByContent(content) {

      var d = new Date();
    var current_year = d.getFullYear();

    if (content == current_year) {
        content = "This Month";
    }
    console.log(content);
  var link = await page.evaluate((text) => {
    const aTags = document.querySelectorAll('a');
    for (let aTag of aTags) {
      if (aTag.innerText === text) {
        return aTag.href;
      }
    }
  }, content);
    console.log(link);
  await page.goto(link);
}

async function deleteYear(year, months) {
    //turn the selected months into a hash
    //to use to filter out months we don't want to delete.
    var selected_months ={};
    for (let i=0; i <months.length; i++) {
        selected_months[months[i]] = 1;
    }
    var monLinks = await getMonthLinks(year,selected_months);

  for (let mon in monLinks) {
    console.log("Deleting month: ", monLinks[mon].name);
    await page.goto(monLinks[mon].link);
    await deletePosts(monLinks[mon].name, year);
  }
}

async function test() {
    console.log("mom");
    return "dad";
}
module.exports.test = test;
module.exports.main = main;
