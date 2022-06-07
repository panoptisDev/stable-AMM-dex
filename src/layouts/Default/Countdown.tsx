import React, { useEffect, useState } from 'react'

const Clock = ({ deadline }) => {
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  const getTimeUntil = (deadline) => {
    const time = Date.parse(deadline) - Date.parse(new Date().toString())
    if (time < 0) {
      setDays(0)
      setHours(0)
      setMinutes(0)
      setSeconds(0)
    } else {
      setDays(Math.floor(time / (1000 * 60 * 60 * 24)))
      setHours(Math.floor((time / (1000 * 60 * 60)) % 24))
      setMinutes(Math.floor((time / 1000 / 60) % 60))
      setSeconds(Math.floor((time / 1000) % 60))
    }
  }

  useEffect(() => {
    let interval = setInterval(() => getTimeUntil(deadline), 1000)

    return () => clearInterval(interval)
  }, [deadline])

  return (
    <>
      {days == 0 && hours == 0 && minutes == 0 && seconds == 0 && (
        <>
          {' '}
          <a
            className="pl-1"
            style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}
            href="/launchpad"
          >
            {' '}
            is now LIVE!
          </a>
        </>
      )}

      {(days != 0 || hours != 0 || minutes != 0 || seconds != 0) && (
        <>
          Starts in {days ? days + 'd ' : ''}
          {hours ? hours + 'h ' : ''}
          {minutes ? minutes + 'm ' : ''}
          {seconds ? seconds + 's ' : 0 + 's'}
        </>
      )}
    </>
  )
}

export default Clock