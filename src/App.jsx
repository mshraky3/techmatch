import { useState } from 'react'
import From from './components/Form'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <From/>
    </>
  )
}

export default App
