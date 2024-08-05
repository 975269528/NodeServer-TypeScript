import * as process from "node:process";
import dotenv from 'dotenv'
import {GameManager} from "./core/GameManager.js";

dotenv.config()


GameManager.run()

GameManager.reg()

