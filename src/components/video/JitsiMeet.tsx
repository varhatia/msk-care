'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface JitsiMeetProps {
  roomName: string
  userName: string
  onLeave?: () => void
  isHost?: boolean
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export default function JitsiMeet({ roomName, userName, onLeave, isHost = false }: JitsiMeetProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  useEffect(() => {
    // Load Jitsi Meet external API
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = initializeJitsi
    document.head.appendChild(script)

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
      }
      document.head.removeChild(script)
    }
  }, [])

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return

    const domain = 'meet.jit.si'
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: userName,
      },
      configOverwrite: {
        startWithAudioMuted: !isHost,
        startWithVideoMuted: !isHost,
        prejoinPageEnabled: false,
        disableModeratorIndicator: true,
        enableClosePage: false,
        toolbarButtons: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
          'mute-video-everyone',
        ],
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
          'mute-video-everyone',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_POWERED_BY: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        MOBILE_APP_PROMO: false,
        AUTHENTICATION_ENABLE: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
      },
    }

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options)

      apiRef.current.addEventListeners({
        readyToClose: handleClose,
        participantLeft: handleParticipantLeft,
        participantJoined: handleParticipantJoined,
        videoConferenceJoined: handleVideoConferenceJoined,
        videoConferenceLeft: handleVideoConferenceLeft,
      })
    } catch (error) {
      console.error('Failed to initialize Jitsi Meet:', error)
    }
  }

  const handleClose = () => {
    if (onLeave) {
      onLeave()
    }
  }

  const handleParticipantLeft = (participant: any) => {
    console.log('Participant left:', participant)
  }

  const handleParticipantJoined = (participant: any) => {
    console.log('Participant joined:', participant)
  }

  const handleVideoConferenceJoined = (participant: any) => {
    console.log('You joined the conference:', participant)
  }

  const handleVideoConferenceLeft = (participant: any) => {
    console.log('You left the conference:', participant)
    if (onLeave) {
      onLeave()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full min-h-[600px] bg-gray-900 rounded-lg overflow-hidden"
    >
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </motion.div>
  )
}
