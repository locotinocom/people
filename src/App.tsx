import { useState } from 'react';
import './App.css'
import level1bg from './assets/backgrounds/garden-6097539.svg'
import Post from "./components/Post";
import SwipeDeck from "./components/SwipeDeck";
import Video from './Video';

function App() {


  return (
    <>
  <div className="app">

<div className="app_videos">

<Video/>
<Video />
<Video/>
<Video />

<Video/>
<Video />
</div>
  </div>


    </>
  )
}

export default App
