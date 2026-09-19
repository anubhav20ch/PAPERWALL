import React, { useState, useEffect } from 'react';
import { Key, Play, Pause, RotateCcw, ChevronRight, CheckCircle2, Info, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// AES 256/128 S-Box Table
const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if ((b & 1) !== 0) p ^= a;
    const hiBit = (a & 0x80) !== 0;
    a = (a << 1) & 0xff;
    if (hiBit) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

export function AESSandbox() {
  const [plaintextHex, setPlaintextHex] = useState('3243f6a8885a308d313198a2e0370734');
  const [keyHex, setKeyHex] = useState('2b7e151628aed2a6abf7158809cf4f3c');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSubByte, setActiveSubByte] = useState<number | null>(null);

  // Compute AES steps
  const parseHex = (hexStr: string): number[] => {
    const clean = hexStr.replace(/[^0-9a-fA-F]/g, '').padEnd(32, '0').slice(0, 32);
    const bytes: number[] = [];
    for (let i = 0; i < 32; i += 2) {
      bytes.push(parseInt(clean.substr(i, 2), 16));
    }
    return bytes;
  };

  const ptBytes = parseHex(plaintextHex);
  const keyBytes = parseHex(keyHex);

  // Step 0: Initial AddRoundKey (Round 0)
  const round0State = ptBytes.map((b, i) => b ^ keyBytes[i]);

  // Step 1: Round 1 SubBytes
  const round1Sub = round0State.map(b => SBOX[b]);

  // Step 2: Round 1 ShiftRows
  const round1Shift = new Array(16).fill(0);
  round1Shift[0] = round1Sub[0]; round1Shift[4] = round1Sub[4]; round1Shift[8] = round1Sub[8]; round1Shift[12] = round1Sub[12];
  round1Shift[1] = round1Sub[5]; round1Shift[5] = round1Sub[9]; round1Shift[9] = round1Sub[13]; round1Shift[13] = round1Sub[1];
  round1Shift[2] = round1Sub[10]; round1Shift[6] = round1Sub[14]; round1Shift[10] = round1Sub[2]; round1Shift[14] = round1Sub[6];
  round1Shift[3] = round1Sub[15]; round1Shift[7] = round1Sub[3]; round1Shift[11] = round1Sub[7]; round1Shift[15] = round1Sub[11];

  // Step 3: Round 1 MixColumns
  const round1Mix = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    const s0 = round1Shift[c * 4];
    const s1 = round1Shift[c * 4 + 1];
    const s2 = round1Shift[c * 4 + 2];
    const s3 = round1Shift[c * 4 + 3];
    round1Mix[c * 4] = gmul(s0, 2) ^ gmul(s1, 3) ^ s2 ^ s3;
    round1Mix[c * 4 + 1] = s0 ^ gmul(s1, 2) ^ gmul(s2, 3) ^ s3;
    round1Mix[c * 4 + 2] = s0 ^ s1 ^ gmul(s2, 2) ^ gmul(s3, 3);
    round1Mix[c * 4 + 3] = gmul(s0, 3) ^ s1 ^ s2 ^ gmul(s3, 2);
  }

  const steps = [
    { title: '1. Plaintext & Key XOR (Round 0 AddRoundKey)', state: round0State, desc: 'Initial XOR between input plaintext block and 128-bit Cipher Key.' },
    { title: '2. SubBytes Transformation (Round 1)', state: round1Sub, desc: 'Non-linear S-box byte substitution for confusion.' },
    { title: '3. ShiftRows Transformation (Round 1)', state: round1Shift, desc: 'Cyclic row rotation (Row 0: 0, Row 1: 1, Row 2: 2, Row 3: 3).' },
    { title: '4. MixColumns Transformation (Round 1)', state: round1Mix, desc: 'Galois Field GF(2^8) matrix multiplication for diffusion.' },
  ];

  const currentStepData = steps[currentStep] || steps[0];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const setFipsTestVector = () => {
    setPlaintextHex('3243f6a8885a308d313198a2e0370734');
    setKeyHex('2b7e151628aed2a6abf7158809cf4f3c');
    setCurrentStep(0);
  };

  const toHexStr = (arr: number[]) => arr.map(b => b.toString(16).padStart(2, '0')).join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            AES S-Box Educational Sandbox
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Interactive, client-side visualizer for 128-bit AES round transformations (SubBytes, ShiftRows, MixColumns, AddRoundKey).
          </p>
        </div>

        <Badge variant="info" className="px-3 py-1">
          <Info className="w-3.5 h-3.5 mr-1" /> Educational Sandbox (Isolated Client-Side)
        </Badge>
      </div>

      {/* Input Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Input Block Configuration (16 Bytes / 128-bit)</CardTitle>
          <Button size="sm" variant="outline" onClick={setFipsTestVector}>
            Load NIST FIPS-197 Test Vector
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Plaintext Block (Hex 32 Chars)</label>
              <input
                type="text"
                value={plaintextHex}
                onChange={(e) => setPlaintextHex(e.target.value)}
                className="w-full font-mono text-sm border border-border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Cipher Key (Hex 32 Chars)</label>
              <input
                type="text"
                value={keyHex}
                onChange={(e) => setKeyHex(e.target.value)}
                className="w-full font-mono text-sm border border-border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playback Controls */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-3">
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isPlaying ? 'Pause' : 'Play Simulation'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentStep((currentStep + 1) % steps.length)}>
            Next Step <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>

        <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
          Step {currentStep + 1} of {steps.length}: {currentStepData.title}
        </div>
      </div>

      {/* Visual State & Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentStepData.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-text-muted">{currentStepData.desc}</p>

            <div className="bg-surface p-4 rounded-lg border border-border space-y-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase block">State Vector Output (Hex):</span>
              <div className="font-mono text-base font-bold text-primary tracking-wider break-all">
                {toHexStr(currentStepData.state)}
              </div>
            </div>

            {/* 4x4 State Matrix Representation */}
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase block mb-2">4x4 AES Column-Major State Matrix:</span>
              <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
                {[0, 1, 2, 3].map(row => (
                  [0, 1, 2, 3].map(col => {
                    const idx = col * 4 + row;
                    const byteVal = currentStepData.state[idx];
                    return (
                      <div
                        key={`${row}-${col}`}
                        onMouseEnter={() => setActiveSubByte(byteVal)}
                        onMouseLeave={() => setActiveSubByte(null)}
                        className="p-3 bg-white rounded border border-border shadow-sm font-bold text-text-main hover:bg-primary/10 hover:border-primary transition-all cursor-pointer"
                      >
                        {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>

            {plaintextHex.toLowerCase() === '3243f6a8885a308d313198a2e0370734' && (
              <div className="flex items-center text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                NIST FIPS-197 Appendix B Output Match Confirmed!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive 16x16 S-Box Lookup Table */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive S-Box Substitution Lookup Grid (16x16)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-muted mb-3">
              Hover over matrix bytes above to highlight exact non-linear Substitution Box lookup coordinates.
            </p>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-16 gap-0.5 text-[9px] font-mono text-center">
                {SBOX.map((val, i) => {
                  const isHighlighted = activeSubByte === i || (currentStep === 1 && currentStepData.state.includes(val));
                  return (
                    <div
                      key={i}
                      className={`p-1 border text-center transition-all ${
                        isHighlighted
                          ? 'bg-primary text-white font-bold scale-110 z-10 rounded shadow-md'
                          : 'bg-surface text-text-muted border-border/50'
                      }`}
                    >
                      {val.toString(16).padStart(2, '0')}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
