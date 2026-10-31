import { useState, useEffect, useMemo } from 'react'
import './App.css'

// Helper to transpose chord strings (e.g. C -> C#, Am -> Bm)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_MAP = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

function transposeChord(chord, semitones) {
  if (!chord) return chord;
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  let [, root, suffix] = match;
  if (FLAT_MAP[root]) root = FLAT_MAP[root];

  let idx = NOTES.indexOf(root);
  if (idx === -1) return chord;

  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;

  return NOTES[newIdx] + suffix;
}

function fnTransposeLyrics(text, semitones) {
  if (semitones === 0 || !text) return text;
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
}

function detectSongKey(lyrics) {
  if (!lyrics) return 'C';
  const match = lyrics.match(/\[([A-G][b#]?[m]?)\]/);
  return match ? match[1] : 'C';
}

const CHORD_DATABASE = {
  'C': { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
  'D': { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
  'E': { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  'Em': { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  'F': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  'G': { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  'A': { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
  'B': { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2 },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2 },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1 },
  'A7sus4': { frets: [-1, 0, 2, 0, 3, 0], baseFret: 1 },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1 },
  'G7': { frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], baseFret: 1 },
  'Bmaj7': { frets: [-1, 2, 4, 3, 4, 2], baseFret: 2 },
};

function ChordDiagram({ chordName }) {
  const normalized = chordName.trim();
  
  // Smart lookup: handle slash chords (e.g. Amaj7/Bmaj7 -> Amaj7, D/E -> D)
  let chordData = CHORD_DATABASE[normalized];
  if (!chordData && normalized.includes('/')) {
    const rootPart = normalized.split('/')[0].trim();
    chordData = CHORD_DATABASE[rootPart];
  }
  // Fallback default shape if chord not found
  if (!chordData) {
    chordData = { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 };
  }
  
  const width = 60;
  const height = 70;
  const startX = 12;
  const startY = 16;
  const stringSpacing = 8;
  const fretSpacing = 12;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 8px', borderRadius: '6px', margin: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#e74c3c' }}>{chordName}</span>
      <svg width={width} height={height}>
        {chordData.baseFret > 1 && (
          <text x="2" y="28" fill="#aaa" fontSize="9" fontFamily="sans-serif">{chordData.baseFret}fr</text>
        )}

        {chordData.baseFret === 1 && (
          <line x1={startX} y1={startY} x2={startX + 5 * stringSpacing} y2={startY} stroke="#fff" strokeWidth="3" />
        )}

        {[0, 1, 2, 3, 4, 5].map(i => (
          <line 
            key={`s-${i}`} 
            x1={startX + i * stringSpacing} 
            y1={startY} 
            x2={startX + i * stringSpacing} 
            y2={startY + 4 * fretSpacing} 
            stroke="#888" 
            strokeWidth="1" 
          />
        ))}

        {[0, 1, 2, 3, 4].map(f => (
          <line 
            key={`f-${f}`} 
            x1={startX} 
            y1={startY + f * fretSpacing} 
            x2={startX + 5 * stringSpacing} 
            y2={startY + f * fretSpacing} 
            stroke="#666" 
            strokeWidth="1" 
          />
        ))}

        {chordData.frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === -1) {
            return (
              <text key={`m-${stringIdx}`} x={x} y={startY - 3} fill="#e74c3c" fontSize="8" textAnchor="middle" fontWeight="bold">×</text>
            );
          } else if (fret === 0) {
            return (
              <circle key={`o-${stringIdx}`} cx={x} cy={startY - 4} r="2" fill="none" stroke="#3498db" strokeWidth="1" />
            );
          } else {
            const relativeFret = fret - (chordData.baseFret - 1);
            if (relativeFret >= 1 && relativeFret <= 4) {
              const y = startY + (relativeFret - 0.5) * fretSpacing;
              return (
                <circle key={`dot-${stringIdx}`} cx={x} cy={y} r="3" fill="#e74c3c" />
              );
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
}

function ChordSheet({ text, fontSize }) {
  if (!text) return null;
  const lines = text.split('\n');

  const extractedChords = useMemo(() => {
    const matches = text.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    const unique = [...new Set(matches.map(m => m.slice(1, -1)))];
    
    // Filter out section headers so they don't appear as chord diagrams
    const sectionKeywords = ['verse', 'chorus', 'pre-chorus', 'bridge', 'solo', 'outro', 'intro'];
    return unique.filter(chord => {
      const lower = chord.toLowerCase();
      return !sectionKeywords.some(sec => lower.includes(sec));
    });
  }, [text]);

  return (
    <div>
      {extractedChords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', fontSize: '11px', fontWeight: 'bold', color: '#3498db', marginBottom: '4px' }}>CHORDS USED IN THIS SONG:</div>
          {extractedChords.map(chord => (
            <ChordDiagram key={chord} chordName={chord} />
          ))}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: `${fontSize}px`, paddingTop: '5px' }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          const isHeader = trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.includes(' ') && !trimmed.includes('/');
          
          if (isHeader) {
            return (
              <div key={lineIdx} style={{ margin: '24px 0 10px 0', fontWeight: 'bold', color: '#3498db', fontSize: `${fontSize + 2}px`, borderBottom: '1px solid #34495e', paddingBottom: '4px' }}>
                {trimmed}
              </div>
            );
          }

          if (!line) {
            return <div key={lineIdx} style={{ height: '20px' }}></div>;
          }

          const parts = line.split(/(\[[^\]]+\])/g);
          let chunks = [];
          
          if (parts[0]) {
            chunks.push({ chord: null, text: parts[0] });
          }

          for (let i = 1; i < parts.length; i += 2) {
            const chord = parts[i] ? parts[i].slice(1, -1) : null;
            const textChunk = parts[i + 1] || '';
            chunks.push({ chord, text: textChunk });
          }

          return (
            <div key={lineIdx} style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'flex-end' }}>
              {chunks.map((chunk, cIdx) => (
                <span key={cIdx} style={{ display: 'inline-flex', flexDirection: 'column', marginRight: '8px' }}>
                  <span style={{ 
                    color: '#e74c3c', 
                    fontSize: `${fontSize - 2}px`, 
                    fontWeight: 'bold', 
                    minHeight: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {chunk.chord || ''}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{chunk.text}</span>
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('chordvault_songs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: '1',
        title: 'Wonderwall',
        singer: 'Oasis',
        songKey: 'Em',
        lyrics: 
`[Verse 1]
[Em]Today is gonna be the day that they're [G]throwin' it back to you
[D]By now you should've [A7sus4]realized what you gotta [Em]do`,
        tabNotes: 
`[Intro]
e|---------------------------------|
B|---3---3---3---3---3---3---3---3-|
G|---4---4---2---0---0---0---0---0-|
D|-------------------2---0---------|
A|---------------------------2-----|
E|---------------------------------|`
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('chordvault_songs', JSON.stringify(songs));
  }, [songs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [fontSize, setFontSize] = useState(16);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', singer: '', songKey: '', lyrics: '', tabNotes: '' });
  const [selectedString, setSelectedString] = useState('e');
  const [barInterval, setBarInterval] = useState(16);

  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const fretsGrid = Array.from({ length: 28 }, (_, i) => i);

  useEffect(() => {
    if (!isAutoScrolling) return;
    const scrollIntervalTimer = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
    }, scrollSpeed);
    return () => clearInterval(scrollIntervalTimer);
  }, [isAutoScrolling, scrollSpeed]);

  useEffect(() => {
    setTransposeOffset(0);
    setIsAutoScrolling(false);
  }, [selectedSongId]);

  const theme = {
    bg: isDarkMode ? '#121212' : '#f8f9fa',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    secondaryCard: isDarkMode ? '#252525' : '#f1f3f5',
    text: isDarkMode ? '#e0e0e0' : '#212529',
    textMuted: isDarkMode ? '#aaa' : '#6c757d',
    border: isDarkMode ? '#333' : '#dee2e6',
    inputBg: isDarkMode ? '#2a2a2a' : '#ffffff',
    inputBorder: isDarkMode ? '#444' : '#ced4da',
  };

  const filteredSongs = useMemo(() => {
    return songs.filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.singer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, searchQuery]);

  const groupedBySinger = useMemo(() => {
    return filteredSongs.reduce((acc, song) => {
      if (!acc[song.singer]) acc[song.singer] = [];
      acc[song.singer].push(song);
      return acc;
    }, {});
  }, [filteredSongs]);

  const activeSong = songs.find(s => s.id === selectedSongId);
  const transposedLyrics = useMemo(() => {
    return activeSong ? fnTransposeLyrics(activeSong.lyrics, transposeOffset) : '';
  }, [activeSong, transposeOffset]);

  const currentSongKey = useMemo(() => {
    if (!activeSong) return '';
    const baseKey = activeSong.songKey || detectSongKey(activeSong.lyrics);
    return transposeChord(baseKey, transposeOffset);
  }, [activeSong, transposeOffset]);

  const handleAdminToggle = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setIsEditing(false);
    } else {
      const password = prompt("Enter Admin Password:");
      if (password === "1234") {
        setIsAdminMode(true);
      } else if (password !== null) {
        alert("Incorrect password!");
      }
    }
  };

  const handleStartEdit = (song) => {
    setEditForm({ 
      title: song.title, 
      singer: song.singer, 
      songKey: song.songKey || detectSongKey(song.lyrics), 
      lyrics: song.lyrics, 
      tabNotes: song.tabNotes || '' 
    });
    setIsEditing(true);
  };

  const handleStartNew = () => {
    setEditForm({ 
      title: '', 
      singer: '', 
      songKey: 'C',
      lyrics: '[Verse 1]\n[C] Type lyrics here...', 
      tabNotes: '[Intro]\ne|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|' 
    });
    setSelectedSongId('new');
    setIsEditing(true);
  };

  const handleSaveSong = (e) => {
    e.preventDefault();
    if (!editForm.title || !editForm.singer) {
      alert('Please enter a song title and singer name.');
      return;
    }

    if (selectedSongId === 'new') {
      const newSong = { id: Date.now().toString(), ...editForm };
      setSongs([newSong, ...songs]);
      setSelectedSongId(newSong.id);
    } else {
      setSongs(songs.map(s => s.id === selectedSongId ? { ...s, ...editForm } : s));
    }
    setIsEditing(false);
  };

  const handleDeleteSong = (id) => {
    if (confirm('Are you sure you want to delete this song?')) {
      setSongs(songs.filter(s => s.id !== id));
      setSelectedSongId(null);
      setIsEditing(false);
    }
  };

  const insertSectionTag = (tag) => {
    setEditForm(prev => ({
      ...prev,
      lyrics: prev.lyrics + `\n\n[${tag}]\n`
    }));
  };

  const appendTokenToAllStrings = (token) => {
    setEditForm(prev => {
      let currentText = prev.tabNotes || '[Intro]\ne|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|';
      let lines = currentText.split('\n');

      let stringLinesMap = {};
      stringNames.forEach(s => {
        let idx = lines.findIndex(l => l.trim().startsWith(`${s}|`));
        if (idx !== -1) {
          stringLinesMap[s] = lines[idx];
        } else {
          stringLinesMap[s] = `${s}|---|`;
        }
      });

      let parsed = {};
      let maxLen = 3;
      stringNames.forEach(s => {
        let match = stringLinesMap[s].match(/\|(.*)\|/);
        let content = match ? match[1] : '---';
        parsed[s] = content;
        if (content.length > maxLen) maxLen = content.length;
      });

      stringNames.forEach(s => {
        while (parsed[s].length < maxLen) {
          parsed[s] += '-';
        }
      });

      stringNames.forEach(s => {
        parsed[s] += token;
      });

      let newLines = lines.map(line => {
        let matchedString = stringNames.find(s => line.trim().startsWith(`${s}|`));
        if (matchedString) {
          return `${matchedString}|${parsed[matchedString]}|`;
        }
        return line;
      });

      stringNames.forEach(s => {
        if (!newLines.some(l => l.trim().startsWith(`${s}|`))) {
          newLines.push(`${s}|${parsed[s]}|`);
        }
      });

      return { ...prev, tabNotes: newLines.join('\n') };
    });
  };

  const appendTokenToTab = (token, targetStr) => {
    setEditForm(prev => {
      let currentText = prev.tabNotes || '[Intro]\ne|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|';
      let lines = currentText.split('\n');

      let stringLinesMap = {};
      stringNames.forEach(s => {
        let idx = lines.findIndex(l => l.trim().startsWith(`${s}|`));
        if (idx !== -1) {
          stringLinesMap[s] = lines[idx];
        } else {
          stringLinesMap[s] = `${s}|---|`;
        }
      });

      let parsed = {};
      let maxLen = 3;
      stringNames.forEach(s => {
        let match = stringLinesMap[s].match(/\|(.*)\|/);
        let content = match ? match[1] : '---';
        parsed[s] = content;
        if (content.length > maxLen) maxLen = content.length;
      });

      stringNames.forEach(s => {
        while (parsed[s].length < maxLen) {
          parsed[s] += '-';
        }
      });

      stringNames.forEach(s => {
        if (s === targetStr) {
          parsed[s] += token;
        } else {
          parsed[s] += '-'.repeat(token.length);
        }
      });

      let newLines = lines.map(line => {
        let matchedString = stringNames.find(s => line.trim().startsWith(`${s}|`));
        if (matchedString) {
          return `${matchedString}|${parsed[matchedString]}|`;
        }
        return line;
      });

      stringNames.forEach(s => {
        if (!newLines.some(l => l.trim().startsWith(`${s}|`))) {
          newLines.push(`${s}|${parsed[s]}|`);
        }
      });

      return { ...prev, tabNotes: newLines.join('\n') };
    });
  };

  const handleFretClick = (strName, fretNum) => {
    setSelectedString(strName);
    const fretStr = fretNum.toString();
    const noteToken = fretStr.length === 1 ? `${fretStr}-` : `${fretStr}`;
    appendTokenToTab(noteToken, strName);
  };

  const handleInsertSymbol = (symbol) => {
    appendTokenToTab(symbol, selectedString);
  };

  const handleInsertManualBar = () => {
    appendTokenToAllStrings('|');
  };

  const handleInsertBarEnd = () => {
    appendTokenToAllStrings('||');
  };

  const handleAutoBar = () => {
    setEditForm(prev => {
      let currentText = prev.tabNotes || '';
      let lines = currentText.split('\n');

      let newLines = lines.map(line => {
        let matchedString = stringNames.find(s => line.trim().startsWith(`${s}|`));
        if (matchedString) {
          let match = line.match(/^([eBGDAE])\|(.*)\|$/);
          if (!match) return line;
          let [, strName, content] = match;
          
          let rawNotes = content.replace(/\|/g, '');
          let chunks = [];
          for (let i = 0; i < rawNotes.length; i += barInterval) {
            chunks.push(rawNotes.slice(i, i + barInterval));
          }
          return `${strName}|${chunks.join('|')}|`;
        }
        return line;
      });

      return { ...prev, tabNotes: newLines.join('\n') };
    });
  };

  const handleDeleteLastNote = () => {
    setEditForm(prev => {
      let currentText = prev.tabNotes || '';
      let lines = currentText.split('\n');

      let stringLinesMap = {};
      stringNames.forEach(s => {
        let idx = lines.findIndex(l => l.trim().startsWith(`${s}|`));
        if (idx !== -1) stringLinesMap[s] = lines[idx];
      });

      let parsed = {};
      let minLen = 999;
      stringNames.forEach(s => {
        if (stringLinesMap[s]) {
          let match = stringLinesMap[s].match(/\|(.*)\|/);
          let content = match ? match[1] : '';
          parsed[s] = content;
          if (content.length < minLen) minLen = content.length;
        }
      });

      if (minLen <= 3) return prev;

      stringNames.forEach(s => {
        if (parsed[s]) {
          parsed[s] = parsed[s].slice(0, -2);
        }
      });

      let newLines = lines.map(line => {
        let matchedString = stringNames.find(s => line.trim().startsWith(`${s}|`));
        if (matchedString) {
          return `${matchedString}|${parsed[matchedString]}|`;
        }
        return line;
      });

      return { ...prev, tabNotes: newLines.join('\n') };
    });
  };

  const insertBlankTabBlock = () => {
    const template = `\n[Chorus / Verse Riff]\ne|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|`;
    setEditForm(prev => ({
      ...prev,
      tabNotes: prev.tabNotes ? prev.tabNotes + template : template.trim()
    }));
  };

  const handleExportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(songs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "chordvault_database.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDatabase = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const importedSongs = JSON.parse(event.target.result);
          if (Array.isArray(importedSongs)) {
            setSongs(importedSongs);
            alert(`Successfully imported ${importedSongs.length} songs!`);
          } else {
            alert('Invalid database format.');
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, transition: 'background 0.3s, color 0.3s', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
        
        {/* Header */}
        <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '24px', cursor: 'pointer' }} onClick={() => { setSelectedSongId(null); setIsEditing(false); setIsAutoScrolling(false); }}>
              🎸 ChordVault
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                style={{ padding: '6px 12px', background: isDarkMode ? '#2c3e50' : '#e0e0e0', color: isDarkMode ? '#f1c40f' : '#333', border: `1px solid ${theme.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                🌙 Night Mode: {isDarkMode ? 'ON' : 'OFF'}
              </button>

              {isAdminMode && (
                <>
                  <button onClick={handleStartNew} style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    + Add Song
                  </button>
                  <button onClick={handleExportDatabase} style={{ padding: '6px 12px', background: '#8e44ad', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }} title="Download JSON">
                    📤 Export DB
                  </button>
                  <label style={{ padding: '6px 12px', background: '#d35400', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }} title="Upload JSON">
                    📥 Import DB
                    <input type="file" accept=".json" onChange={handleImportDatabase} style={{ display: 'none' }} />
                  </label>
                </>
              )}

              <button 
                onClick={handleAdminToggle} 
                style={{ padding: '6px 12px', background: isAdminMode ? '#e74c3c' : '#34495e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
              >
                {isAdminMode ? '🔓 Admin (ON)' : '🔒 Admin Login'}
              </button>
            </div>
          </div>

          {!isEditing && (
            <input 
              type="text" 
              placeholder="🔍 Search by singer name or song title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, outline: 'none' }}
            />
          )}
        </header>

        {/* Editing / Admin Form View */}
        {isEditing ? (
          <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2>{selectedSongId === 'new' ? '➕ Add New Song' : '✏️ Edit Song'}</h2>
              {selectedSongId !== 'new' && (
                <button type="button" onClick={() => handleDeleteSong(selectedSongId)} style={{ padding: '6px 12px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                  🗑️ Delete Song
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSong} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Song Title:</label>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Singer / Artist:</label>
                  <input type="text" value={editForm.singer} onChange={(e) => setEditForm({...editForm, singer: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Song Key:</label>
                  <input type="text" placeholder="e.g. C, Em" value={editForm.songKey} onChange={(e) => setEditForm({...editForm, songKey: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Lyrics & Chords (with Sections):</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: theme.textMuted, alignSelf: 'center' }}>Insert Section:</span>
                    {['Intro', 'Verse 1', 'Chorus', 'Pre-Chorus', 'Bridge', 'Solo', 'Outro'].map(sec => (
                      <button key={sec} type="button" onClick={() => insertSectionTag(sec)} style={{ padding: '3px 8px', fontSize: '11px', background: '#3498db', border: 'none', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}>
                        +{sec}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={editForm.lyrics} onChange={(e) => setEditForm({...editForm, lyrics: e.target.value})} rows={5} style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
              </div>

              {/* TabbyPro Style Interactive Fretboard Builder */}
              <div style={{ background: theme.secondaryCard, padding: '16px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3498db' }}>🎸 Interactive Fretboard:</span>
                    <span style={{ fontSize: '12px', background: '#2c3e50', color: '#f1c40f', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Active String: {selectedString}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={handleInsertManualBar} style={{ padding: '4px 10px', background: '#8e44ad', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="Insert manual measure bar (|)">
                      | Bar
                    </button>
                    <button type="button" onClick={handleInsertBarEnd} style={{ padding: '4px 10px', background: '#9b59b6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="Insert bar end (||)">
                      || Bar End
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#16a085', borderRadius: '4px', padding: '2px 6px', gap: '4px' }}>
                      <button type="button" onClick={handleAutoBar} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="Click to auto-format barlines">
                        ⚡ Auto-Bar ({barInterval})
                      </button>
                      <button type="button" onClick={() => setBarInterval(prev => Math.max(4, prev - 2))} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', borderRadius: '2px', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Decrease spacing">-</button>
                      <button type="button" onClick={() => setBarInterval(prev => prev + 2)} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', borderRadius: '2px', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Increase spacing">+</button>
                    </div>

                    <button type="button" onClick={handleDeleteLastNote} style={{ padding: '4px 10px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="Delete last entry">
                      ← Delete
                    </button>
                    <button type="button" onClick={insertBlankTabBlock} style={{ padding: '4px 10px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="Add section block">
                      + New Block
                    </button>
                  </div>
                </div>

                {/* Articulation, Rest & Technique Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', background: '#1a1a1a', padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 'bold', marginRight: '4px' }}>Actions:</span>
                  {[
                    { label: '⏸ Rest (-)', val: '-' },
                    { label: 'h (Hammer)', val: 'h' },
                    { label: 'p (Pull)', val: 'p' },
                    { label: '/ (Slide Up)', val: '/' },
                    { label: '\\ (Slide Down)', val: '\\' },
                    { label: 'b (Bend)', val: 'b' },
                    { label: 'r (Release)', val: 'r' },
                    { label: '~ (Vibrato)', val: '~' },
                    { label: 'x (Mute)', val: 'x' }
                  ].map(tech => (
                    <button
                      key={tech.val}
                      type="button"
                      onClick={() => handleInsertSymbol(tech.val)}
                      style={{
                        padding: '3px 8px',
                        background: '#333',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                      title={`Append ${tech.label} to string ${selectedString}`}
                    >
                      {tech.label}
                    </button>
                  ))}
                </div>

                {/* 28-Fret Matrix Board */}
                <div style={{ overflowX: 'auto', background: '#181818', padding: '12px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '820px' }}>
                    
                    {/* Fret Numbers Header */}
                    <div style={{ display: 'flex', gap: '3px', paddingLeft: '28px', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                      {fretsGrid.map(fret => (
                        <div key={fret} style={{ width: '26px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: fret === 12 || fret === 24 ? '#3498db' : '#777' }}>
                          {fret}
                        </div>
                      ))}
                    </div>

                    {/* Strings and Fret Buttons */}
                    {stringNames.map(str => (
                      <div key={str} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedString(str)}
                          style={{
                            width: '24px',
                            height: '26px',
                            background: selectedString === str ? '#e74c3c' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`Select string ${str} as active`}
                        >
                          {str}
                        </button>
                        {fretsGrid.map(fret => (
                          <button
                            key={fret}
                            type="button"
                            onClick={() => handleFretClick(str, fret)}
                            style={{
                              width: '26px',
                              height: '26px',
                              background: '#222',
                              color: '#aaa',
                              border: '1px solid #333',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={`Append fret ${fret} on string ${str}`}
                          >
                            {fret === 0 ? '0' : '•'}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Tablature Code Editor (Live Edit & Preview):</label>
                <textarea 
                  value={editForm.tabNotes} 
                  onChange={(e) => setEditForm({...editForm, tabNotes: e.target.value})} 
                  rows={9} 
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', background: '#2980b9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save Song</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', background: '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        ) : activeSong ? (
          // Song Reader View
          <div>
            {/* Sticky Practice Toolbar */}
            <div style={{ 
              position: 'sticky', 
              top: '0', 
              zIndex: 100, 
              background: theme.cardBg, 
              padding: '12px 15px', 
              borderRadius: '8px', 
              border: `1px solid ${theme.border}`, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              marginBottom: '15px',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '10px' 
            }}>
              <button onClick={() => { setSelectedSongId(null); setIsAutoScrolling(false); }} style={{ padding: '6px 12px', background: theme.secondaryCard, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Library
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Transpose */}
                <div style={{ display: 'flex', alignItems: 'center', background: theme.secondaryCard, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${theme.border}`, fontSize: '12px' }}>
                  <span>Key: {transposeOffset === 0 ? 'Orig' : (transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset)}</span>
                  <button onClick={() => setTransposeOffset(prev => prev - 1)} style={{ marginLeft: '6px', padding: '2px 6px', cursor: 'pointer' }}>-</button>
                  <button onClick={() => setTransposeOffset(prev => prev + 1)} style={{ marginLeft: '2px', padding: '2px 6px', cursor: 'pointer' }}>+</button>
                </div>

                {/* Font Size */}
                <div style={{ display: 'flex', alignItems: 'center', background: theme.secondaryCard, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${theme.border}`, fontSize: '12px' }}>
                  <span>Font</span>
                  <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} style={{ marginLeft: '6px', padding: '2px 6px', cursor: 'pointer' }}>A-</button>
                  <button onClick={() => setFontSize(prev => Math.min(24, prev + 2))} style={{ marginLeft: '2px', padding: '2px 6px', cursor: 'pointer' }}>A+</button>
                </div>

                {/* Scroll Speed Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', background: theme.secondaryCard, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${theme.border}`, fontSize: '12px' }}>
                  <span style={{ marginRight: '4px' }}>Speed:</span>
                  <select 
                    value={scrollSpeed} 
                    onChange={(e) => setScrollSpeed(Number(e.target.value))}
                    style={{ background: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '3px', padding: '2px 4px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    <option value={60}>1x Slow</option>
                    <option value={30}>2x Medium</option>
                    <option value={15}>3x Fast</option>
                  </select>
                </div>

                {/* Auto-Scroll Toggle */}
                <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} style={{ padding: '6px 14px', background: isAutoScrolling ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  {isAutoScrolling ? '⏹ Stop Scroll' : '▶ Auto-Scroll'}
                </button>

                {isAdminMode && (
                  <button onClick={() => handleStartEdit(activeSong)} style={{ padding: '6px 10px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0' }}>{activeSong.title}</h2>
                  <h4 style={{ margin: 0, color: theme.textMuted, fontWeight: 'normal' }}>Artist: {activeSong.singer}</h4>
                </div>
                {/* Display Current Song Key Badge */}
                <div style={{ background: '#3498db', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  🎵 Key: {currentSongKey}
                </div>
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: 'flex', gap: '10px', borderBottom: `2px solid ${theme.border}`, marginBottom: '20px', paddingBottom: '8px' }}>
                <button onClick={() => setActiveTab('lyrics')} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', border: 'none', background: activeTab === 'lyrics' ? '#3498db' : theme.secondaryCard, color: activeTab === 'lyrics' ? '#fff' : theme.text }}>
                  🎵 Lyrics & Chords
                </button>
                <button onClick={() => setActiveTab('tabs')} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', border: 'none', background: activeTab === 'tabs' ? '#3498db' : theme.secondaryCard, color: activeTab === 'tabs' ? '#fff' : theme.text }}>
                  🎸 Full Guitar Tablature
                </button>
              </div>

              {activeTab === 'lyrics' ? (
                <div style={{ background: theme.secondaryCard, padding: '20px', borderRadius: '6px', border: `1px solid ${theme.border}`, minHeight: '200px' }}>
                  <ChordSheet text={transposedLyrics} fontSize={fontSize} />
                </div>
              ) : (
                <div style={{ background: theme.secondaryCard, padding: '20px', borderRadius: '6px', border: `1px solid ${theme.border}`, overflowX: 'auto' }}>
                  <pre style={{ fontFamily: 'monospace', fontSize: `${fontSize}px`, margin: '0', lineHeight: '1.5', color: theme.text }}>
                    {activeSong.tabNotes || 'No tablature available for this song.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Singer Grouped Library View
          <div>
            {Object.keys(groupedBySinger).length === 0 ? (
              <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No songs found matching "{searchQuery}".</p>
            ) : (
              Object.keys(groupedBySinger).map(singer => (
                <div key={singer} style={{ marginBottom: '25px', background: theme.cardBg, padding: '15px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>
                    🎤 {singer} <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: 'normal' }}>({groupedBySinger[singer].length} songs)</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {groupedBySinger[singer].map(song => (
                      <button key={song.id} onClick={() => setSelectedSongId(song.id)} style={{ textAlign: 'left', padding: '12px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.secondaryCard, cursor: 'pointer', fontWeight: '500', color: theme.text, transition: 'all 0.2s' }}>
                        🎵 {song.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;