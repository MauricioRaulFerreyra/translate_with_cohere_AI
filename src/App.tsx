import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useStore } from './hooks/useStore'
import { Button, Col, Container, Row, Stack } from 'react-bootstrap'
import { AUTO_LANGUAGE, VOICE_FOR_LANGUAGE } from './constants'
import { ArrowsIcon, ClipboardIcon, SpeakerIcon } from './components/Icons'
import { LanguageSelector } from './components/LanguageSelector'
import { SectionType } from './types.d'
import { TextArea } from './components/TextArea'
import { translate } from './services/cohere_translate'
import { useEffect } from 'react'
import { useDebounce } from './hooks/useDebounce'

function App() {
  const {
    fromLanguage,
    interchangeLanguages,
    setFromLanguage,
    setToLanguage,
    toLanguage,
    setFromText,
    fromText,
    result,
    setResult,
    loading
  } = useStore()

  const debouncedFromText = useDebounce(fromText, 1000)

  useEffect(() => {
    // Solo realizar la traducción si hay texto para traducir
    if (debouncedFromText === '') {
      setResult('')
      return
    }

    let timeoutId: NodeJS.Timeout

    const doTranslation = () => {
      translate({ fromLanguage, toLanguage, text: debouncedFromText })
        .then(result => {
          if (result == null) return
          setResult(result)
        })
        .catch(error => {
          if (error.message?.includes('TooManyRequestsError')) {
            // Reintenta después de un tiempo
            timeoutId = setTimeout(doTranslation, 6000) // espera 6 segundos antes de reintentar
          } else {
            console.error('Translation error:', error)
            setResult('Error en la traducción. Por favor, intente nuevamente.')
          }
        })
    }
  
    doTranslation()
  
    // Limpieza
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [debouncedFromText, fromLanguage, toLanguage])

  const handleClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result)
      // Opcional: Mostrar una notificación de éxito
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(result)
    utterance.lang = VOICE_FOR_LANGUAGE[toLanguage]
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  return (
    <Container fluid style={{maxWidth:'800px'}}>
      <h2 style={{textAlign:'center',margin:'1rem',color:'#9b97979f'}}>Traductor con Cohere AI</h2>
      <Row>
        <Col>
          <Stack gap={2}>
            <LanguageSelector 
              type={SectionType.From}
              value={fromLanguage}
              onChange={setFromLanguage} 
            />
            <TextArea
              type={SectionType.From}
              value={fromText}
              onChange={setFromText}
            />
          </Stack>
        </Col>

        <Col xs='auto'>
          <Button
            variant='link'
            disabled={fromLanguage === AUTO_LANGUAGE} 
            onClick={interchangeLanguages}>
            <ArrowsIcon />
          </Button>
        </Col>
        
        <Col>
          <Stack gap={2}>
            <LanguageSelector 
              type={SectionType.To}
              value={toLanguage}
              onChange={setToLanguage}
            />
            <div style={{ position: 'relative' }}>
            <TextArea
              loading={loading}
              type={SectionType.To}
              value={result}
              onChange={setResult}
              />
            <div style={{ position: 'absolute', left: 0, bottom: 0, display: 'flex' }}>
              <Button
                variant='link'
                onClick={handleClipboard}
                title="Copiar traducción">
                <ClipboardIcon />
              </Button>
              <Button
                variant='link'
                onClick={handleSpeak}
                title="Escuchar traducción">
                <SpeakerIcon />
              </Button>
              </div>
            </div>
          </Stack>
        </Col>
      </Row>
    </Container>
  )
}

export default App