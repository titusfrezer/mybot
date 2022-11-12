

const { Bot, Context, session, Keyboard, InlineKeyboard } = require("grammy");
const axios = require("axios");
const {
  conversations,
  createConversation,
} = require("@grammyjs/conversations");
const { Menu } = require("@grammyjs/menu");

const bot = new Bot(process.env.BOT_TOKEN);
module.exports = { bot };

bot.use(session());

bot.use(conversations());

/** Defines the conversation */
async function greeting(conversation, ctx) {
  await ctx.reply("እንኳን ደህና መጡ | Welcome To The Bot");
  const result = await requestDetail(conversation, ctx);

  if (!result) {
    await ctx.reply("Nothing submitted!");
  } else {
    if (result.service == "Agent Registration") {
      await ctx.reply("Please wait you are registering ...");
      let res;
      try {
        res = await axios.post(
          `https://betenethiopia.com/api/agentregistration`,
          {
            name: result.agentName,
            phone: result.mainPhoneNumber,
            facebook_link: result.facebookPage,
            telegram_link: result.telegramAddress,
            location: result.location,
            photo: result.photo,
          }
        );

        await ctx.reply(
          `በተሳካ ሁኔታ ተመዝግበዋል ከታች ያለው የእርሶ መለያ ኮድ ነው:\nAgent Id: ${res.data.agentid} \nPassword: ${res.data.password}`
        );
      } catch (e) {
        console.log("e" + e);
        await ctx.reply(`ችግር ተፈጥሯል ስልክ ቁጥርዎ ከዚህ በፊት ተመዝግቧል`);
      }
    } else {
      await ctx.reply("እናመሰግናለን");

      await ctx.reply(
        `መረጃዎን ያረጋግጡ \n
        ከተማ | Town: ${result.town}\n
        የሚፈልጉት አገልግሎት|Type Of Service : ${result.property_type_id}\n
        ሙሉ ስም | FullName:  ${result.fullName}\n
        ስልክ ቁጥር | Phone Number፡ ${result.phoneNumber}
        Role:  ${result.owner_id}\n
        ምድብ | Category: ${result.category}\n
        የክፍል ብዛት | Room: ${result.number_of_rooms}\n
        የመኝታ ክፍል ብዛት | BedRoom: ${result.number_of_bed_rooms}\n
        የመታጠቢያ ክፍል ብዛት | BathRoom: ${result.number_of_bath_rooms}\n
        ካሬ ሜተር | Area Square ${result.area}\n
        ገለፃ | Description ${result.description}
         `,
        { reply_markup: new InlineKeyboard().text("Yes").text("No") }
      );
      const submitCallBack = await conversation.waitFor("callback_query:data");
      const isItRightData = submitCallBack.callbackQuery.data;

      if (isItRightData == "Yes") {
        try {
          const res = await axios.post(
            `https://betenethiopia.com/api/addproperty`,
            {
              town: result.town,
              property_type_id: result.property_type_id,
              owner_id: result.owner_id,
              category: result.category,
              description: result.description,
              number_of_bed_rooms:
                result.number_of_bed_rooms == "5+"
                  ? 6
                  : result.number_of_bed_rooms,
              number_of_bath_rooms:
                result.number_of_bath_rooms == "5+"
                  ? 6
                  : result.number_of_bath_rooms,
              number_of_rooms:
                result.number_of_rooms == "5+" ? 6 : result.number_of_rooms,
              number_of_saloons: result.number_of_salon,
              area: result.area,
              price: result.price,
              property_images: result.property_images,
              village_name: result.village_name,
              car_parking: result.car_parking,
              owners_living_there: result.ownerThere,
              swimming_pool: result.swimThere,
              garden: result.gardenThere,
              phone_number: result.phoneNumber,
              owner_name: result.fullName,
            }
          );
          console.log(res);
          await ctx.reply(
            `ንብረቶ ተመዝግቧል የእርሶ ምዝገባ ቁጥር ${res.data.order_code} ነዉ፡፡ ቤቱን ከተሸጠ የተላከሎትን ምዝገባ ቁጥር ጠቅሰዉ SOLD ብለዉ ወደ @betenethiopiadoc ቴሌግራም ይላኩ፡፡ የንብረቱ ቪዲዮ ካሎት ምዝገባ ቁጥር ጠቅሰዉ ወደ @betenethiopiadoc ቴሌግራም ይላኩ`
          );
        } catch (e) {
          await ctx.reply("Something went wrong");
          console.log(e);
        }
      } else {
        await ctx.reply("Order Cancelled");
      }
    }
  }
}
async function requestDetail(conversation, ctx) {
  await ctx.reply("ከተማ | Choose Town", {
    reply_markup: new InlineKeyboard().text("Adama").text("Addis Ababa"),
  });
  const townCallBack = await conversation.waitFor("callback_query:data");
  const town = townCallBack.callbackQuery.data;

  await ctx.reply(
    "ምን አይነት አገልግሎት ነው የሚፈልጉት | What type of service do you want?",
    {
      reply_markup: new InlineKeyboard()
        .text("ሽያጭ | Sale")
        .row()
        .text("ኪራይ | Rent")
        .row()
        .text("እንደ ደላላ ለመመዝገብ | Agent Registration"),
    }
  );
  const serivceCallBack = await conversation.waitFor("callback_query:data");
  const service = serivceCallBack.callbackQuery.data;
  let serviceId;
  if (service == "ሽያጭ | Sale") {
    serviceId = 1;
  } else if (service == "ኪራይ | Rent") {
    serviceId = 2;
  }
  if (service == "እንደ ደላላ ለመመዝገብ | Agent Registration") {
    await ctx.reply("የሚመዘገበው ማን ነው? | Who is registering?", {
      reply_markup: new InlineKeyboard()
        .text("እኔ | Me")
        .row()
        .text("ሌላ ሰው | For Other"),
    });
    const whoToRegister = await conversation.waitFor("callback_query:data");
    const who = whoToRegister.callbackQuery.data;
    let agentName = "";
    let mainPhoneNumber = "";
    if (who == "እኔ | Me") {
      await ctx.reply("ሙሉ ስም | Enter Full Name");
      agentName = (await conversation.waitFor("message:text")).message.text;

      await ctx.reply("ስልክ ቁጥርዎን ለማስገባት ከታች ያለውን ስልክ ቁጥር አጋራ የሚለውን ይጫኑ", {
        reply_markup: new Keyboard().requestContact("ስልክ ቁጥር አጋራ").resized(),
      });
      const phoneNumber1 = await conversation.waitFor(":contact");
      mainPhoneNumber = await phoneNumber1.message.contact.phone_number;
      mainPhoneNumber = mainPhoneNumber.replace("+251", "0");
    } else {
      await ctx.reply("የተመዝጋቢው  ስም | Enter Full Name");
      agentName = (await conversation.waitFor("message:text")).message.text;

      await ctx.reply("የተመዝጋቢው ስልክ ቁጥር | Enter Phone Number");
      ctx = await conversation.wait();

      while (
        !(ctx.message.text.length == 10) ||
        ctx.message.text.toString().match(/[0-9]/g) == null
      ) {
        await ctx.reply("እባክዋ በዚህ መንገድ ስልክ ቁጥር ያስገቡ 0911121314");
        ctx = await conversation.wait();
      }
      mainPhoneNumber = ctx.message.text;
    }

    // await ctx.reply("Phone Number 2", {
    //   reply_markup: { remove_keyboard: true },
    // });
    // const phoneNumber2 = await conversation.form.number();

    await ctx.reply("የፌስቡክ ገጽ(ከሌለ የለም ብለው ያስገቡ) | Personal Facebook Page");
    const facebookPage = (await conversation.waitFor("message:text")).message
      .text;

    await ctx.reply("የቴሌግራም አካውንቴ(ከሌለ የለም ብለው ያስገቡ) | Telegram Address");
    const telegramAddress = (await conversation.waitFor("message:text")).message
      .text;

    await ctx.reply("መገኛህ | Your Location");
    const location = (await conversation.waitFor("message:text")).message.text;

    await ctx.reply("የፊት ገፅታዎን የሚያሳይ ፎቶ ያያይዙ (1 ብቻ) |Upload Self Picture");
    ctx = await conversation.wait();
    while (!ctx.message?.photo) {
      await ctx.reply("የፊት ገፅታዎን የሚያሳይ ፎቶ ማስገባት አለብዎት");
      ctx = await conversation.wait();
    }
    const agentPhoto = ctx.message.photo;
    const agentPhotoUrl = await ctx.api.getFile(
      agentPhoto[agentPhoto.length - 1].file_id
    );
    return {
      telegramAddress,
      service: "Agent Registration",
      agentName,
      mainPhoneNumber,
      facebookPage,
      telegramAddress,
      location,
      photo: agentPhotoUrl.file_path,
    };
  } else {
    await ctx.reply("ሙሉ ስም | Enter Your Full Name");
    const fullName = (await conversation.waitFor("message:text")).message.text;
    await ctx.reply("ደላላ / ባለቤት | Are You Agent/Owner", {
      reply_markup: new InlineKeyboard().text("Agent").text("Owner"),
    });
    const roleCallBack = await conversation.waitFor("callback_query:data");
    const role = roleCallBack.callbackQuery.data;
    const homeCategory = {
      "Villa Houses | ቪላ ቤት": "Villa Houses",
      "Corporate House | የማህበር ቤት": "Corporate House",
      "Apartment | አፓርትመንት": "Apartment",
      "Condominium | ኮንዶሚኒየም": "Condominium",
      "Real Estate | ሪል እስቴት": "Real Estate",
      "Commercial Building | የንግድ ህንፃ": "Commercial Building",
      "Service House | ሰርቪስ ቤት": "Service House",
      "Land | መሬት": "Land",
      "Meeting Hall | የስብሰባ አዳራሽ": "Meeting Hall",
      "Garage | ጋራጅ": "Garage",
      "Warehouses | መጋዘን": "Warehouses",
      "GuestHouse | የእንግዳ ቤት": "Guest House",
      "Others | ሌሎች": "Other",
    };
    const roomKeyBoard = new InlineKeyboard()
      .text("1")
      .text("2")
      .text("3")
      .text("4")
      .text("5")
      .text("5+")
      .row()
      .text("Skip/ይለፉ");
    if (role == "Agent") {
      await ctx.reply("Enter Your Agent Code");
      const agentCode = (await conversation.waitFor("message:text")).message
        .text;
      try {
        const result = await axios.get(
          `https://betenethiopia.com/api/checkagentcode/${agentCode}`
        );
        if (result.data.success) {
          await ctx.reply("ምድብ ይምረጡ | Choose Property Category", {
            reply_markup: new InlineKeyboard()
              .text("Villa Houses | ቪላ ቤት")
              .row()
              .text("Corporate House | የማህበር ቤት")
              .row()
              .text("Apartment | አፓርትመንት")
              .row()
              .text("Condominium | ኮንዶሚኒየም")
              .row()
              .text("Real Estate | ሪል እስቴት")
              .row()
              .text("Commercial Building | የንግድ ህንፃ")
              .row()
              .text("Service House | ሰርቪስ ቤት")
              .row()
              .text("Land | መሬት")
              .row()
              .text("Meeting Hall | የስብሰባ አዳራሽ")
              .row()
              .text("Garage | ጋራጅ")
              .row()
              .text("Warehouses | መጋዘን")
              .row()
              .text("GuestHouse | የእንግዳ ቤት")
              .row()
              .text("Others | ሌሎች")
              .row(),
          });
          const categoryCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          const category =
            homeCategory[String(categoryCallBack.callbackQuery.data)];
          // await ctx.reply("የንብረት ስም | Property Name");
          // const property_title = (await conversation.waitFor("message:text"))
          //   .message.text;
          await ctx.reply("የመንደር ስም |Village Name");
          const village_name = (await conversation.waitFor("message:text"))
            .message.text;
          await ctx.reply("የክፍል ብዝት | Number of Room", {
            reply_markup: roomKeyBoard,
          });
          const roomCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          let number_of_rooms = roomCallBack.callbackQuery.data;

          if (number_of_rooms == "Skip/ይለፉ") {
            number_of_rooms = 0;
          }
          await ctx.reply("የሳሎን ቤት ብዝት | Number of Salon", {
            reply_markup: roomKeyBoard,
          });
          const salonCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          let number_of_salon = salonCallBack.callbackQuery.data;

          if (number_of_salon == "Skip/ይለፉ") {
            number_of_salon = 0;
          }
          await ctx.reply("የመኝታ ክፍል ብዛት | Number of Bed Room", {
            reply_markup: roomKeyBoard,
          });
          const bedRoomCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          let number_of_bed_rooms = bedRoomCallBack.callbackQuery.data;

          if (number_of_bed_rooms == "Skip/ይለፉ") {
            number_of_bed_rooms = 0;
          }
          await ctx.reply("የመታጠቢያ ከፍል ብዛት | Number of Bath Room", {
            reply_markup: roomKeyBoard,
          });
          const bathRoomCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          let number_of_bath_rooms = bathRoomCallBack.callbackQuery.data;

          if (number_of_bath_rooms == "Skip/ይለፉ") {
            number_of_bath_rooms = 0;
          }
          await ctx.reply("የመኪና ማቆሚያ አለው | Does it have car parking?", {
            reply_markup: new InlineKeyboard()
              .text("Yes")
              .text("No")
              .text("Skip/ይለፉ"),
          });
          const parkingCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          const parking = parkingCallBack.callbackQuery.data;
          let carParking;
          if (parking == "Yes") {
            carParking = 1;
          } else {
            carParking = 0;
          }
          await ctx.reply("ባለቤቱ አብሮ ይኖራል? | Does the Owner live there?", {
            reply_markup: new InlineKeyboard()
              .text("Yes")
              .text("No")
              .text("Skip/ይለፉ"),
          });
          const ownerCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          const ownerLiveThere = ownerCallBack.callbackQuery.data;
          let ownerThere;
          if (ownerLiveThere == "Yes") {
            ownerThere = 1;
          } else {
            ownerThere = 0;
          }
          await ctx.reply("የመዋኛ ገንዳ አለው? | Does it have swimming pool?", {
            reply_markup: new InlineKeyboard()
              .text("Yes")
              .text("No")
              .text("Skip/ይለፉ"),
          });
          const swimmingCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          const swimmingExists = swimmingCallBack.callbackQuery.data;
          let swimThere;
          if (swimmingExists == "Yes") {
            swimThere = 1;
          } else {
            swimThere = 0;
          }
          await ctx.reply("የአትክልት ስፍራ አለው? | Does it have garden?", {
            reply_markup: new InlineKeyboard()
              .text("Yes")
              .text("No")
              .text("Skip/ይለፉ"),
          });
          const gardenCallBack = await conversation.waitFor(
            "callback_query:data"
          );
          const gardenExists = gardenCallBack.callbackQuery.data;

          let gardenThere;
          if (gardenExists == "Yes") {
            gardenThere = 1;
          } else {
            gardenThere = 0;
          }
          await ctx.reply(
            "አጠቃላይ ስፋት(በካሬ ሜትር ይግለጹ) | Total Area Square(define using m²)"
          );
          ctx = await conversation.wait();
          while (!ctx.message.text.match(/[0-9]/g)) {
            await ctx.reply("እባክዎ አጠቃላይ ስፋት(በካሬ ሜትር ይግለጹ)");
            ctx = await conversation.wait();
          }
          const area = ctx.message.text;

          await ctx.reply("ዋጋ (ለምሳሌ 1000000) | Price");
          ctx = await conversation.wait();

          while (!ctx.message.text.match(/[0-9,]/g)) {
            await ctx.replay("እባክዋ የቤቱን ዋጋ ከላይ በተጠቀሰው መልኩ ያስገቡ");
            ctx = await conversation.wait();
          }
          let price = ctx.message.text;
          price = price.replaceAll(",", "");
          await ctx.reply("ስልክ ቁጥር | PhoneNumber");
          const phoneNumber = await conversation.form.number();

          let photoUrls = [];
          await ctx.reply("ከ 2 በላይ ፎቶ ያያይዙ ሲጨርሱ /done ይጻፉ");
          let photo;
          do {
            photo = await conversation.waitFor("message");
            if (photo.has(":photo")) {
              const photos = await photo.message.photo;
              const file = await ctx.api.getFile(
                photos[photos.length - 1].file_id
              );
              photoUrls.push(file.file_path);
            }
          } while (photo.has(":photo"));

          console.log("photot url s" + photoUrls);

          await ctx.reply("ገለጻ | Description");
          const description = (await conversation.waitFor("message:text"))
            .message.text;

          return {
            town,
            village_name,
            property_type_id: serviceId,
            fullName,
            owner_id: result.data.agentInfo,
            category,
            number_of_rooms,
            number_of_bed_rooms,
            number_of_bath_rooms,
            number_of_salon,
            ownerThere,
            area,
            car_parking: carParking,
            ownerThere,
            swimThere,
            gardenThere,
            price,
            phoneNumber,
            property_images: photoUrls,
            description,
          };
        } else {
          await ctx.reply(
            "Sorry You are not allowed to post, please register first"
          );
        }
      } catch (e) {
        await ctx.reply("Some thing went wrong please try again");
      }

      // console.log(result.data);
    } else {
      await ctx.reply("ምድብ ይምረጡ | Choose Property Category", {
        reply_markup: new InlineKeyboard()
          .text("Villa Houses | ቪላ ቤት")
          .row()
          .text("Corporate House | የማህበር ቤት")
          .row()
          .text("Apartment | አፓርትመንት")
          .row()
          .text("Condominium | ኮንዶሚኒየም")
          .row()
          .text("Real Estate | ሪል እስቴት")
          .row()
          .text("Commercial Building | የንግድ ህንፃ")
          .row()
          .text("Service House | ሰርቪስ ቤት")
          .row()
          .text("Land | መሬት")
          .row()
          .text("Meeting Hall | የስብሰባ አዳራሽ")
          .row()
          .text("Garage | ጋራጅ")
          .row()
          .text("Warehouses | መጋዘን")
          .row()
          .text("GuestHouse | የእንግዳ ቤት")
          .row()
          .text("Others | ሌሎች")
          .row(),
      });
      const categoryCallBack = await conversation.waitFor(
        "callback_query:data"
      );
      const category =
        homeCategory[String(categoryCallBack.callbackQuery.data)];
      // await ctx.reply("የንብረት ስም | Property Name");
      // const property_title = (await conversation.waitFor("message:text"))
      //   .message.text;
      await ctx.reply("የመንደር ስም | Village Name");
      const village_name = (await conversation.waitFor("message:text")).message
        .text;
      await ctx.reply("የክፍል ብዝት | Number of Room", {
        reply_markup: roomKeyBoard,
      });
      const roomCallBack = await conversation.waitFor("callback_query:data");
      let number_of_rooms = roomCallBack.callbackQuery.data;

      if (number_of_rooms == "Skip/ይለፉ") {
        number_of_rooms = 0;
      }
      await ctx.reply("የሳሎን ቤት ብዝት | Number of Salon", {
        reply_markup: roomKeyBoard,
      });
      const salonCallBack = await conversation.waitFor("callback_query:data");
      let number_of_salon = salonCallBack.callbackQuery.data;

      if (number_of_salon == "Skip/ይለፉ") {
        number_of_salon = 0;
      }
      await ctx.reply("የመኝታ ክፍል ብዛት | Number of Bed Room", {
        reply_markup: roomKeyBoard,
      });
      const bedRoomCallBack = await conversation.waitFor("callback_query:data");
      let number_of_bed_rooms = bedRoomCallBack.callbackQuery.data;

      if (number_of_bed_rooms == "Skip/ይለፉ") {
        number_of_bed_rooms = 0;
      }
      await ctx.reply("የመታጠቢያ ከፍል ብዛት | Number of Bath Room", {
        reply_markup: roomKeyBoard,
      });
      const bathRoomCallBack = await conversation.waitFor(
        "callback_query:data"
      );
      let number_of_bath_rooms = bathRoomCallBack.callbackQuery.data;

      if (number_of_bath_rooms == "Skip/ይለፉ") {
        number_of_bath_rooms = 0;
      }
      await ctx.reply("የመኪና ማቆሚያ አለው | Does it have car parking?", {
        reply_markup: new InlineKeyboard()
          .text("Yes")
          .text("No")
          .text("Skip/ይለፉ"),
      });
      const parkingCallBack = await conversation.waitFor("callback_query:data");
      const parking = parkingCallBack.callbackQuery.data;
      let carParking;
      if (parking == "Yes") {
        carParking = 1;
      } else {
        carParking = 0;
      }
      await ctx.reply("ባለቤቱ አብሮ ይኖራል? | Does the Owner live there?", {
        reply_markup: new InlineKeyboard()
          .text("Yes")
          .text("No")
          .text("Skip/ይለፉ"),
      });
      const ownerCallBack = await conversation.waitFor("callback_query:data");
      const ownerLiveThere = ownerCallBack.callbackQuery.data;
      let ownerThere;
      if (ownerLiveThere == "Yes") {
        ownerThere = 1;
      } else {
        ownerThere = 0;
      }
      await ctx.reply("የመዋኛ ገንዳ አለው? | Does it have swimming pool?", {
        reply_markup: new InlineKeyboard()
          .text("Yes")
          .text("No")
          .text("Skip/ይለፉ"),
      });
      const swimmingCallBack = await conversation.waitFor(
        "callback_query:data"
      );
      const swimmingExists = swimmingCallBack.callbackQuery.data;
      let swimThere;
      if (swimmingExists == "Yes") {
        swimThere = 1;
      } else {
        swimThere = 0;
      }
      await ctx.reply("የአትክልት ስፍራ አለው? | Does it have garden?", {
        reply_markup: new InlineKeyboard()
          .text("Yes")
          .text("No")
          .text("Skip/ይለፉ"),
      });
      const gardenCallBack = await conversation.waitFor("callback_query:data");
      const gardenExists = gardenCallBack.callbackQuery.data;

      let gardenThere;
      if (gardenExists == "Yes") {
        gardenThere = 1;
      } else {
        gardenThere = 0;
      }
      await ctx.reply(
        "አጠቃላይ ስፋት(በካሬ ሜትር ይግለጹ) | Total Area Square(define using m²)"
      );
      ctx = await conversation.wait();
      while (!ctx.message.text.match(/[0-9]/g)) {
        await ctx.reply("እባክዎ አጠቃላይ ስፋት(በካሬ ሜትር ይግለጹ)");
        ctx = await conversation.wait();
      }
      const area = ctx.message.text;

      await ctx.reply("ዋጋ (ለምሳሌ 1000000) | Price");
      ctx = await conversation.wait();

      while (!ctx.message.text.match(/[0-9,]/g)) {
        await ctx.replay("እባክዋ የቤቱን ዋጋ ከላይ በተጠቀሰው መልኩ ያስገቡ");
        ctx = await conversation.wait();
      }
      let price = ctx.message.text;
      price = price.replaceAll(",", "");

      await ctx.reply("ስልክ ቁጥር | PhoneNumber");
      let phoneNumber = await conversation.form.number();

      let photoUrls = [];
      await ctx.reply("ከ 2 በላይ ፎቶ ያያይዙ ሲጨርሱ /done ይጻፉ");
      let photo;
      do {
        photo = await conversation.waitFor("message");
        if (photo.has(":photo")) {
          const photos = await photo.message.photo;
          const file = await ctx.api.getFile(photos[photos.length - 1].file_id);
          photoUrls.push(file.file_path);
        }
      } while (photo.has(":photo"));

      console.log("photot url s" + photoUrls);

      await ctx.reply("ገለጻ | Description");
      const description = (await conversation.waitFor("message:text")).message
        .text;

      return {
        town,
        village_name,
        property_type_id: serviceId,
        fullName,
        owner_id: role,
        category,
        number_of_rooms,
        number_of_bed_rooms,
        number_of_bath_rooms,
        number_of_salon,
        ownerLiveThere,
        area,
        car_parking: carParking,
        ownerThere,
        swimThere,
        gardenThere,
        price,
        phoneNumber,
        property_images: photoUrls,
        description,
      };
    }
  }

}
bot.use(createConversation(greeting));
bot.command("start", async (ctx) => {
  // enter the function "greeting" you declared
  await ctx.conversation.enter("greeting");
});

bot.command("help", async (ctx) => {
  await ctx.reply(`ለደላላ ምዝገባ
  መልስ
  -	የአገልግሎት አይነት ላይ ለደላላ ምዝገባ የሚለዉን በመጫን የሚጠይቆትን መረጃ ይሙሉ
  መልስ
  -	ደንበኞች የእርሶን ፎቶ በማየታቸዉ ከደንበኛዉ ጋር በሚኖሮትን ግንኙነት መልካም ሁኔታን ስለሚፈጥር ፎቶ መሰረታዊ ነዉ
  መልስ
  በቴሌግራም ቦት ለደላላ ሲመዘገቡ Facebook, telegram, YouTube ሲጠየቁ ካሎት ሊንኩን ያስገቡ ከሌሎት የለም ብለዉ ይለፉ
  መልስ
  -	የኤጀንት ኮዱን እና ፓስወርድ ካገኙ በኋላ የይለፍ ቃል ማስተካከል፣ የንብረት ማስመዝገብ በሚመለከት መመሪያ ከቴሌግራም ቻናላችን Beten Ethiopia ቴሌግራም ግሩፕ/ ቻናል ማግኘት ይችላሉ፡፡ 
  ለንብረት ማስመዝገብ
  መልስ
  መሬት፣ አዳራሽ፣ መጋዘን እና ሌሎች ክፍል የሌላቸዉ በቴሌግራም ቦት ሲያስመዘግቡ የክፍል ብዛት መጠይቅ ላይ ላይ skip ቁልፍን ተጭነዉ ይለፉ
  መልስ
  የንብረቱን ቪድዮ በቴሌግራም ለመላክ በ@betenethiopiadoc አድራሻ የምዝገባ ቁጥሮን ጠቅሰዉ መላክ ይችላሉ፡፡
  መልስ
  የንብረቱን መመዝገብ በድርጅቱ ድህረ ገፅ http://www.betenethiopia.com እና በቴሌግራም ቻናላችን telegram ማረጋገጥ ይችላሉ 
  
  Help address: 0970000111/ 0908000222/ 0988214131
 
  
  `);
});

bot.start();