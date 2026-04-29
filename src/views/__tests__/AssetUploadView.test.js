import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function makeSetFile(selectedFile, toast) {
  return function setFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa imágenes, PDF, vídeo o audio.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('El archivo supera el límite de 10MB.')
      return
    }
    selectedFile.value = file
  }
}

describe('setFile — validación de archivo', () => {
  let selectedFile
  let toast
  let setFile

  beforeEach(() => {
    selectedFile = ref(null)
    toast = { error: vi.fn() }
    setFile = makeSetFile(selectedFile, toast)
  })

  it('rechaza un archivo .exe y llama toast.error', () => {
    const file = new File(['contenido'], 'malware.exe', { type: 'application/octet-stream' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith(
      'Tipo de archivo no permitido. Usa imágenes, PDF, vídeo o audio.'
    )
    expect(selectedFile.value).toBeNull()
  })

  it('rechaza un archivo mayor de 10MB y llama toast.error', () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024)
    const file = new File([bigContent], 'grande.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith('El archivo supera el límite de 10MB.')
    expect(selectedFile.value).toBeNull()
  })

  it('acepta un .jpg válido y asigna selectedFile', () => {
    const file = new File(['imagen'], 'foto.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).not.toHaveBeenCalled()
    expect(selectedFile.value).toBe(file)
  })
})
