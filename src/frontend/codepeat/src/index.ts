import {mount} from "svelte";

import "./tailwind.css";
import "./index.css";

import ApplicationFrame from "./components/app-frame/ApplicationFrame.svelte";

mount(ApplicationFrame, {target: document.body});
