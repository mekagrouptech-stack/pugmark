import { useState, useEffect } from 'react'
import {
  getLocale,
  setLocale,
  t,
  translateField,
  translateGroup,
  translateOption,
} from './translations'

export const useTranslation = () => {
  const [locale, setLocaleState] = useState(getLocale())

  useEffect(() => {
    const handler = () => setLocaleState(getLocale())
    window.addEventListener('localechange', handler)
    return () => window.removeEventListener('localechange', handler)
  }, [])

  const changeLocale = (newLocale) => {
    setLocale(newLocale)
    setLocaleState(newLocale)
  }

  return {
    locale,
    setLocale: changeLocale,
    t,
    translateField,
    translateGroup,
    translateOption,
  }
}
