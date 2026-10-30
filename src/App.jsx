import { useState, useEffect, useRef } from 'react'

const INITIAL_SONGS = [
  { 
    id: 1, 
    title: "Amazing Grace", 
    artist: "John Newton", 
    key: "G", 
    category: "Worship",
    lyricsText: "[G]Amazing [C]grace! How [G]sweet the sound\nThat [G]saved a wretch like [D7]me!\nI [G]once was lost, but [C]now am found,\nWas [G]blind, but [D7]now I [G]see."
  },
  { 
    id: 2, 
    title: "Hotel California", 
    artist: "Eagles", 
    key: "Bm", 
    category: "Rock",
    lyricsText: "[Bm]On a dark desert highway, [F#]cool wind in my hair\n[A]Warm smell of colitas, [E]rising up through the air"
  }
]

const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

function transposeChord(chord, semitones) {
  if (!chord) return ""
  const regex = /^([A-G][#b]?)(.*)/
  const match = chord.match(regex)
  if (!match) return chord

  let base = match[1]
  const extension = match[2]

  const flatToSharp = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" }
  if (flatToSharp[base]) base = flatToSharp[base]

  const currentIndex = CHROMATIC_SCALE.indexOf(base)
  if (currentIndex === -1) return chord

  let newIndex = (currentIndex + semitones) % 12
  if (newIndex < 0) newIndex += 12

  return CHROMATIC_SCALE[newIndex] + extension
}

function parseLyrics(text, transposeOffset = 0) {
  const rawLines = (text || "").split('\n')
  return rawLines.map(line => {
    const regex = /\[(.*?)\]([^\[]*)/g
    let match
    let parts = []

    const firstBracket = line.indexOf('[')
    if (firstBracket > 0) {
      parts.push({ chord: "", text: line.substring(0, firstBracket) })
    } else if (firstBracket === -1 && line.length > 0) {
      parts.push({ chord: "", text: line })
    }

    while ((match = regex.exec(line)) !== null) {
      parts.push({
        chord: transposeChord(match[1], transposeOffset),
        text: match[2]
      })
    }
    return parts.length > 0 ? parts : [{ chord: "", text: line }]
  })
}

function App() {
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('chordvault_songs')
    return saved ? JSON.parse(saved) : INITIAL_SONGS
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSong, setSelectedSong] = useState(null)
  const [transposeOffset, setTransposeOffset] = useState(0)
  const [isAddingSong, setIsAddingSong] = useState(false)

  // Reference for hidden file input for importing backups
  const fileInputRef = useRef(null)

  // Form states
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newKey, setNewKey] = useState('G')
  const [newCategory, setNewCategory] = useState('Pop')
  const [newLyrics, setNewLyrics] = useState('')

  useEffect(() => {
    localStorage.setItem('chordvault_songs', JSON.stringify(songs))
  }, [songs])

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || song.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenSong = (song) => {
    setSelectedSong(song)
    setTransposeOffset(0)
  }

  const handleSaveSong = (e) => {
    e.preventDefault()
    if (!newTitle || !newArtist) return

    const newSongObj = {
      id: Date.now(),
      title: newTitle,
      artist: newArtist,
      key: newKey,
      category: newCategory,
      lyricsText: newLyrics
    }

    setSongs([newSongObj, ...songs])
    setNewTitle('')
    setNewArtist('')
    setNewKey('G')
    setNewCategory('Pop')
    setNewLyrics('')
    setIsAddingSong(false)
  }

  // --- EXPORT BACKUP TO JSON FILE ---
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(songs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `chordvault-backup-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // --- IMPORT BACKUP FROM JSON FILE ---
  const handleImportBackup = (e) => {
    const fileReader = new FileReader()
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8")
      fileReader.onload = (event) => {
        try {
          const importedSongs = JSON.parse(event.target.result)
          if (Array.isArray(importedSongs)) {
            setSongs(importedSongs)
            alert("Vault backup imported successfully!")
          } else {
            alert("Invalid backup file format.")
          }
        } catch (error) {
          alert("Error reading JSON file.")
        }
      }
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* App Header */}
      <header style={{ backgroundColor: '#1e293b', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', cursor: 'pointer' }} onClick={() => { setSelectedSong(null); setIsAddingSong(false); }}>
          🎵 Song & Chord Vault
        </h1>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Hidden file input for importing */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportBackup} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            title="Import backup JSON file"
          >
            📂 Import
          </button>
          <button 
            onClick={handleExportBackup}
            style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            title="Download backup JSON file for Google Drive"
          >
            💾 Backup
          </button>
          <button 
            onClick={() => { setIsAddingSong(true); setSelectedSong(null); }}
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Add Song
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '800px', margin: '24px auto', padding: '0 16px' }}>
        
        {isAddingSong ? (
          /* --- ADD SONG FORM --- */
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Add New Song</h2>
            <form onSubmit={handleSaveSong} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Song Title:</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="e.g., Let It Be" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Artist:</label>
                <input 
                  type="text" 
                  value={newArtist} 
                  onChange={(e) => setNewArtist(e.target.value)} 
                  placeholder="e.g., The Beatles" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Key:</label>
                  <input 
                    type="text" 
                    value={newKey} 
                    onChange={(e) => setNewKey(e.target.value)} 
                    placeholder="e.g., C, G, Am" 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Category:</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: 'white' }}
                  >
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Worship">Worship</option>
                    <option value="Country">Country</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>
                  Lyrics & Chords (Put chords in brackets like [C] before words):
                </label>
                <textarea 
                  value={newLyrics} 
                  onChange={(e) => setNewLyrics(e.target.value)} 
                  rows="6"
                  placeholder="[C]When I find myself in [G]times of trouble..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddingSong(false)}
                  style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Song
                </button>
              </div>
            </form>
          </div>
        ) : selectedSong ? (
          /* --- SONG DETAIL VIEW --- */
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setSelectedSong(null)}
              style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px', fontWeight: 'bold' }}
            >
              ← Back to List
            </button>
            
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#0f172a' }}>{selectedSong.title}</h2>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '16px' }}>Artist: {selectedSong.artist} | Original Key: {selectedSong.key}</p>
            
            {/* Transpose Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#334155' }}>Transpose:</span>
              <button 
                onClick={() => setTransposeOffset(prev => prev - 1)}
                style={{ backgroundColor: '#cbd5e1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                -1
              </button>
              <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>
                {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
              </span>
              <button 
                onClick={() => setTransposeOffset(prev => prev + 1)}
                style={{ backgroundColor: '#cbd5e1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                +1
              </button>
              {transposeOffset !== 0 && (
                <button 
                  onClick={() => setTransposeOffset(0)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', marginLeft: 'auto', fontSize: '14px' }}
                >
                  Reset
                </button>
              )}
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '20px' }} />
            
            {/* Chord Chart Container */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '16px', lineHeight: '2.2', whiteSpace: 'pre-wrap' }}>
              {parseLyrics(selectedSong.lyricsText, transposeOffset).map((line, lineIndex) => (
                <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {line.map((part, partIndex) => (
                    <div key={partIndex} style={{ display: 'inline-flex', flexDirection: 'column', marginRight: '8px' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '14px', height: '20px' }}>
                        {part.chord}
                      </span>
                      <span style={{ color: '#0f172a' }}>
                        {part.text}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- SONG LIST VIEW WITH CATEGORY TABS --- */
          <>
            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['All', 'Pop', 'Rock', 'Worship', 'Country', 'Custom'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? '#2563eb' : 'white',
                    color: selectedCategory === cat ? 'white' : '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Song Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSongs.length > 0 ? (
                filteredSongs.map(song => (
                  <div 
                    key={song.id} 
                    onClick={() => handleOpenSong(song)}
                    style={{ 
                      backgroundColor: 'white', 
                      padding: '16px 20px', 
                      borderRadius: '8px', 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{song.title}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{song.artist}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Key: {song.key}
                      </span>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {song.category}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>No songs found matching your filter.</p>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  )
}

export default App