import os

def create_sample_pdf(filename):
    content = """%PDF-1.7
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj

2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 4 0 R
      /F2 5 0 R
    >>
  >>
  /Contents 6 0 R
>>
endobj

4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj

5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj

6 0 obj
<< /Length 1250 >>
stream
BT
/F1 18 Tf
50 740 Td
(DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING) Tj
0 -25 Td
(CS-701: POST-QUANTUM CRYPTOGRAPHY EXAM) Tj

/F2 12 Tf
0 -30 Td
(Time Allowed: 3 Hours) Tj
300 0 Td
(Max Marks: 100) Tj
-300 -15 Td
(Semester: Fall 2026) Tj
300 0 Td
(Date: November 20, 2026) Tj

0 -40 Td
/F1 14 Tf
(SECTION A: Post-Quantum Key Encapsulation (ML-KEM / Kyber)) Tj
/F2 11 Tf
0 -20 Td
(Q1. [15 Marks] Explain the Module Learning With Errors (M-LWE) problem.) Tj
0 -15 Td
(    a) Define the rank k=3 lattice parameter for ML-KEM-768.) Tj
0 -15 Td
(    b) Contrast implicit rejection in ML-KEM with explicit error throwing in RSA.) Tj

0 -30 Td
/F1 14 Tf
(SECTION B: Digital Signatures & Non-Repudiation (ML-DSA / Dilithium)) Tj
/F2 11 Tf
0 -20 Td
(Q2. [20 Marks] Describe the Fiat-Shamir with Aborts paradigm used in ML-DSA-65.) Tj
0 -15 Td
(    a) Why are rejection sampling steps necessary during signature generation?) Tj
0 -15 Td
(    b) Prove existential unforgeability under chosen message attack (EUF-CMA).) Tj

0 -30 Td
/F1 14 Tf
(SECTION C: Zero-Trust Access Control & Provenance) Tj
/F2 11 Tf
0 -20 Td
(Q3. [15 Marks] Explain how SHA3-256 hash chains ensure audit non-repudiation.) Tj
0 -15 Td
(    a) Detail the event linkage: prev_record_hash = SHA3-256(previous_event).) Tj
0 -15 Td
(    b) Explain how policy engine rules gate AES-256-GCM key release.) Tj

ET
endstream
endobj

xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000276 00000 n 
0000000349 00000 n 
0000000417 00000 n 

trailer
<<
  /Size 7
  /Root 1 0 R
>>
startxref
1720
%%EOF
"""
    with open(filename, "wb") as f:
        f.write(content.encode("latin-1"))
    print(f"Created sample question paper: {filename}")

if __name__ == "__main__":
    out_path = os.path.join("c:\\Users\\anubh\\Desktop\\cypto", "Sample_Crypto_Exam_2026.pdf")
    create_sample_pdf(out_path)
