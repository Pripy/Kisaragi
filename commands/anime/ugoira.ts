import Ugoira from 'node-ugoira';

exports.run = async (client: any, message: any, args: string[]) => {
    const PixivApi = require('pixiv-api-client');
    const pixiv = new PixivApi();
    let input;
    if (args[1].toLowerCase() === "r18" || args[1].toLowerCase() === "en") {
        if (args[2] === "en") {
            input = client.combineArgs(args, 3);
        } else {
            input = client.combineArgs(args, 2);
        }
    } else {
        input = client.combineArgs(args, 1);
    }
    let pixivID;

    if (input.match(/\d+/g) !== null) {
        pixivID = input.match(/\d+/g).join("");
    } else {
        if (args[1].toLowerCase() === "r18") {
            if (args[2].toLowerCase() === "en") {
                let image = await client.getPixivImage(input, true, true, true, true);
                    try {
                        pixivID = image.id;
                    } catch (err) {
                        if (err) client.pixivErrorEmbed();
                    }
            } else {
                let image = await client.getPixivImage(input, true, false, true, true);
                    try {
                        pixivID = image.id;
                    } catch (err) {
                        if (err) client.pixivErrorEmbed();
                    }
            }
        } else if (args[1].toLowerCase() === "en") {
            let image = await client.getPixivImage(input, false, true, true, true);
                try {
                    pixivID = image.id;
                } catch (err) {
                    if (err) client.pixivErrorEmbed();
                }
        } else {
            let image = await client.getPixivImage(input, false, false, true, true);
                try {
                    pixivID = image.id;
                } catch (err) {
                    if (err) client.pixivErrorEmbed();
                }
        }
    }
    
    //const webp = require('webp-converter');
    await pixiv.login(process.env.PIXIVR18_NAME, process.env.PIXIVR18_PASSWORD);
    let details = await pixiv.illustDetail(pixivID)
    console.log(details)
    let ugoiraInfo = await pixiv.ugoiraMetaData(pixivID);
    let fileNames: any = []; 
    let frameDelays: any = [];
    let frameNames: any = [];
    let inputArray: any = [];
    for (let i in ugoiraInfo.ugoira_metadata.frames) {
        frameDelays.push(ugoiraInfo.ugoira_metadata.frames[i].delay);
        fileNames.push(ugoiraInfo.ugoira_metadata.frames[i].file);
    }
    for (let i in fileNames) {
        frameNames.push(fileNames[i].slice(0, -4));
    }
    for (let i in frameNames) {
        inputArray.push(`ugoira/${pixivID}/${frameNames[i]}.webp +${frameDelays[i]}`);
    }
    
    let refreshToken = await pixiv.refreshAccessToken();
    const ugoira = new Ugoira(pixivID);
    await ugoira.initUgoira(refreshToken.refresh_token);
    /*
    for (let i in fileNames) {
        webp.cwebp(`ugoira/${pixivID}/${fileNames[i]}`,`ugoira/${pixivID}/${frameNames[i]}.webp`, "-q 80", function (status,error) {
                return console.log(status,error);	
            });
    }
    webp.webpmux_animate(inputArray,`ugoira/${pixivID}.webp`,"10","255,255,255,255",function (status,error) {
            return console.log(status,error);	
        });

    
    for (let i in savedFrames) {
        webp.dwebp(`ugoira/${pixivID}/${savedFrames[i]}.webp`,`ugoira/${pixivID}/${savedFrames[i]}.png`,"-o", function(status,error) {
            return console.log(status,error);	
        });
    }*/    
    
    let pics: any = [];
    const fs = require('fs');
    if (fileNames.length > 40) {
        if (fileNames.length > 80) {
            if (fileNames.length > 150) {
                for (let i = 0; i < fileNames.length; i+=9) {
                    pics.push(fileNames[i]);
                }
            }
            for (let i = 0; i < fileNames.length; i+=6) {
                pics.push(fileNames[i]);
            }
        }
        for (let i = 0; i < fileNames.length; i+=3) {
            pics.push(fileNames[i]);
        }
    } else {
        for (let i = 0; i < fileNames.length; i++) {
            pics.push(fileNames[i]);
        }
    }

    const sizeOf = require('image-size');
    let dimensions = sizeOf(`ugoira/${pixivID}/${pics[0]}`);
    let getPixels = require('get-pixels')
    let GifEncoder = require('gif-encoder');
    let gif = new GifEncoder(dimensions.width, dimensions.height);
    let file = fs.createWriteStream(`ugoira/${pixivID}/${pixivID}.gif`, (err) => console.log(err));

    gif.pipe(file);
    gif.setQuality(20);
    gif.setDelay(0);
    gif.setRepeat(0);
    gif.writeHeader();
    let counter = 0;
    
    let addToGif = (images) => {
        console.log(`ugoira/${pixivID}/${images[counter]}`)
        getPixels(`ugoira/${pixivID}/${images[counter]}`, function(err, pixels) {
            gif.addFrame(pixels.data);
            gif.read();
                if (counter >= images.length - 1) {
                    gif.finish();
                } else {
                        counter++;
                        addToGif(images);
                    }
        })
    }
    
    let msg = message.channel.send(`**Converting Ugoira to Gif. This might take awhile** ${client.getEmoji("gabCircle")}`)
    addToGif(pics);
    msg.delete(1000);
    
    gif.on("end", async () => {
        
        let msg = message.channel.send(`**Compressing Gif** ${client.getEmoji("gabCircle")}`)
        await client.compressGif([`ugoira/${pixivID}/${pixivID}.gif`]);
        msg.delete(1000);

            const pixivImg = require('pixiv-img');
            let ugoiraEmbed = client.createEmbed();
            const {Attachment} = require("discord.js");
            let outGif = new Attachment(`../assets/gifs/${pixivID}.gif`);
            let comments = await pixiv.illustComments(pixivID);
            let cleanText = details.illust.caption.replace(/<\/?[^>]+(>|$)/g, "");
            let authorUrl = await pixivImg(details.illust.user.profile_image_urls.medium);
            let authorAttachment = new Attachment(authorUrl);
                let commentArray: string[] = [];
                for (let i = 0; i <= 5; i++) {
                    if (!comments.comments[i]) break;
                    commentArray.push(comments.comments[i].comment);
                }
            ugoiraEmbed
            .setTitle(`**Pixiv Ugoira** ${client.getEmoji("kannaSip")}`)
            .setURL(`https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${pixivID}`)
            .setDescription(
                `${client.getEmoji("star")}_Title:_ **${details.illust.title}**\n` + 
                `${client.getEmoji("star")}_Artist:_ **${details.illust.user.name}**\n` + 
                `${client.getEmoji("star")}_Creation Date:_ **${client.formatDate(details.illust.create_date)}**\n` + 
                `${client.getEmoji("star")}_Views:_ **${details.illust.total_view}**\n` + 
                `${client.getEmoji("star")}_Bookmarks:_ **${details.illust.total_bookmarks}**\n` + 
                `${client.getEmoji("star")}_Description:_ ${cleanText ? cleanText : "None"}\n` + 
                `${client.getEmoji("star")}_Comments:_ ${commentArray.join() ? commentArray.join() : "None"}\n` 
                )
            .attachFiles([outGif.file, authorAttachment])
            .setThumbnail(`attachment://${authorAttachment.file}`)
            .setImage(`attachment://${pixivID}.gif`)
            message.channel.send(ugoiraEmbed);
            });
        });   
}