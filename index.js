import {
  createPostOnDiscordChannel,
  initDiscord,
  client,
  createEmbed,
} from "./discord/index.js";
import { collectionsID, collectionsURL, maxValues } from "./helpers/index.js";
import * as frakt from "@frakt-protocol/frakt-sdk";
import * as anchor from "@project-serum/anchor";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Set trigger, channelId, roleId & time for each run(ms)
const time = parseInt(process.env.TIME);
const percent = Number(process.env.PERCENT);
const channelID = process.env.DISCORD_ALERT_CHANNEL_ID;
const roleID = process.env.DISCORD_ROLE_ID;

// Set Solana Cluster
const solanaEndPoint = process.env.RPC_ENDPOINT;

// Initialize conenction
const conn = new anchor.web3.Connection(solanaEndPoint, "confirmed");
const programId = new frakt.web3.PublicKey(
  "A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ"
);

// Variables for first time running file
let depositYield = {};
let first = true;

await initDiscord();

// Logic for sending message
const main = async () => {
  try {
    // Get pool info from SDK
    const allInfo = await axios.get(
      "https://fraktion-monorep.herokuapp.com/stats/lending-pools"
    );
    // Set variables for first run
    if (first) {
      allInfo.data.forEach((pool) => {
        let collectionName = pool.nftName;
        let depositAPR = pool.apr;
        depositYield[`${collectionName}`] = depositAPR;
      });
      first = false;
    }
    // Compare last run with current run & check if trigger
    allInfo.data.forEach(async (pool) => {
      let collectionName = pool.nftName;
      let currentAPR = pool.apr;
      let pastAPR = depositYield[`${collectionName}`];
      let trigger = pastAPR + percent;
      if (currentAPR >= trigger) {
        let message = `<@&${roleID}>, yield on ${collectionName} just jumped to ${currentAPR}! 🚀`;
        await createPostOnDiscordChannel(channelID, message);
      }
      depositYield[`${collectionName}`] = currentAPR;
    });
    console.log(depositYield);
  } catch (error) {
    console.error("Post on discord channel failed ", error);
  }
};

// Catching slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  // make bot await the reply
  await interaction.deferReply();
  const { commandName } = interaction;
  let dy = {};
  // logic for command yield
  if (commandName === "yield") {
    const allInfo = await axios.get(
      "https://fraktion-monorep.herokuapp.com/stats/lending-pools"
    );
    allInfo.data.forEach((pool) => {
      let collectionName = pool.nftName;
      let depositAPR = pool.apr;
      dy[`${collectionName}`] = depositAPR;
    });
    let top3 = await maxValues(dy, 3);
    let embed = (await createEmbed(top3)).data;
    // finally send reply
    await interaction.editReply({ embeds: [embed] });
  }
});

// Run bot
setInterval(main, time);
