import React, { useState } from "react";
import "./App.css";

const API_URL = "https://web-production-bdc56.up.railway.app";

function fmt(value, decimals) {
  return Number(value).toFixed(decimals);
}

function buildMailtoLink(subject, body, toEmail = "") {
  const subjectEncoded = encodeURIComponent(subject);
  const bodyEncoded = encodeURIComponent(body);
  return `mailto:${toEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`;
}

export default function App() {
  const [authorName, setAuthorName] = useState("Rasool Elahi");
  const [fs, setFs] = useState(6.0);
  const [sigmaY, setSigmaY] = useState(30.0);
  const [E, setE] = useState(28500.0);
  const [L, setL] = useState(9.0);
  const [dout, setDout] = useState(0.63);
  const [fAxial, setFAxial] = useState(1033.0);

  const [showImage, setShowImage] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("buckling_report.docx");
  const [mailtoLink, setMailtoLink] = useState("");

  const payload = {
    author_name: authorName.trim(),
    fs: Number(fs),
    sigma_y: Number(sigmaY),
    E: Number(E),
    L: Number(L),
    dout: Number(dout),
    f_axial: Number(fAxial),
  };

  async function handleSolve() {
    setError("");
    setLoading(true);
    setMailtoLink("");

    try {
      const response = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(`Could not connect to the API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport() {
    setError("");
    setLoading(true);
    setMailtoLink("");

    try {
      const calcResponse = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!calcResponse.ok) {
        throw new Error(`Calculation failed: ${calcResponse.status}`);
      }

      const calcData = await calcResponse.json();
      setResults(calcData);

      const reportResponse = await fetch(`${API_URL}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!reportResponse.ok) {
        throw new Error(`Report generation failed: ${reportResponse.status}`);
      }

      const blob = await reportResponse.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      setDownloadUrl(fileUrl);

      const contentDisposition = reportResponse.headers.get("Content-Disposition");
      let fileName = "buckling_report.docx";

      if (contentDisposition && contentDisposition.includes("filename=")) {
        fileName = contentDisposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      setDownloadFileName(fileName);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`Failed to generate the report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailReport() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);

      const emailBody =
        `Hi,\n\n` +
        `Please find the buckling report attached.\n\n` +
        `Author: ${authorName}\n` +
        `Length Factor K: ${fmt(data.K, 3)}\n` +
        `Equivalent Length Le (in): ${fmt(data.Le, 4)}\n` +
        `Euler Load (lbf): ${fmt(data.Pcr_euler, 2)}\n` +
        `Johnson Load (lbf): ${fmt(data.Pcr_johnson, 2)}\n` +
        `MS Euler: ${fmt(data.MS_euler, 2)}\n` +
        `MS Johnson: ${fmt(data.MS_johnson, 2)}\n\n` +
        `Best regards,`;

      const link = buildMailtoLink(`Buckling Report - ${authorName}`, emailBody);
      setMailtoLink(link);
    } catch (err) {
      setError(`Could not connect to the API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="hero-title">Buckling Calculator</h1>

        <div className="form-group">
          <label>Author Name</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>FS</label>
            <input
              type="number"
              step="0.1"
              value={fs}
              onChange={(e) => setFs(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Yield Strength (ksi)</label>
            <input
              type="number"
              step="0.1"
              value={sigmaY}
              onChange={(e) => setSigmaY(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Elastic Modulus (ksi)</label>
            <input
              type="number"
              step="100"
              value={E}
              onChange={(e) => setE(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Length (in)</label>
            <input
              type="number"
              step="0.1"
              value={L}
              onChange={(e) => setL(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Diameter (in)</label>
            <input
              type="number"
              step="0.01"
              value={dout}
              onChange={(e) => setDout(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Load (lbf)</label>
            <input
              type="number"
              step="1"
              value={fAxial}
              onChange={(e) => setFAxial(e.target.value)}
            />
          </div>
        </div>

        <div className="checkbox-row">
          <input
            id="showImage"
            type="checkbox"
            checked={showImage}
            onChange={(e) => setShowImage(e.target.checked)}
          />
          <label htmlFor="showImage">Show End Condition Image</label>
        </div>

        {showImage && (
          <div className="image-box">
            <img src="/End_Condition.png" alt="End Condition" className="end-image" />
          </div>
        )}

        <div className="button-row">
          <button onClick={handleSolve} disabled={loading}>
            Solve
          </button>
          <button onClick={handleDownloadReport} disabled={loading}>
            Download Word Report
          </button>
          <button onClick={handleEmailReport} disabled={loading}>
            Email Report
          </button>
        </div>

        {loading && <p className="info-text">Working...</p>}

        {error && <div className="error-box">{error}</div>}

        {mailtoLink && (
          <div className="info-box">
            <a href={mailtoLink} className="mail-btn">
              Open Outlook Email
            </a>
            <p className="small-note">
              Download the Word report first, then attach it manually to the email.
            </p>
          </div>
        )}

        {results && (
          <>
            <h2 className="section-title">Results</h2>

            <div className="results-grid">
              <div className="result-card">
                <div className="result-name">Effective Length Factor K</div>
                <div className="result-value">{fmt(results.K, 3)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">Equivalent Length Le (in)</div>
                <div className="result-value">{fmt(results.Le, 4)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">Area A (in²)</div>
                <div className="result-value">{fmt(results.A, 6)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">Moment of Inertia I (in⁴)</div>
                <div className="result-value">{fmt(results.I, 6)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">Euler Load (lbf)</div>
                <div className="result-value">{fmt(results.Pcr_euler, 2)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">Johnson Load (lbf)</div>
                <div className="result-value">{fmt(results.Pcr_johnson, 2)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">MS Euler</div>
                <div className="result-value">{fmt(results.MS_euler, 2)}</div>
              </div>

              <div className="result-card">
                <div className="result-name">MS Johnson</div>
                <div className="result-value">{fmt(results.MS_johnson, 2)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}