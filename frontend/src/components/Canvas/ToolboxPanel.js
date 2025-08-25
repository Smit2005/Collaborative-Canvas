import React, { useState, useEffect } from "react";
import axios from "axios";

const pythonApi = axios.create({
  baseURL: "http://localhost:8000",
});

const StyledFileInput = ({ onChange, multiple = false, acceptedFileType, selectedFiles }) => {
  let buttonText = "Choose File(s)";
  if (selectedFiles) {
    if (multiple && selectedFiles.length > 0) {
      if (selectedFiles.length === 1) {
        buttonText = selectedFiles[0].name;
      } else {
        buttonText = `${selectedFiles[0].name} + ${selectedFiles.length - 1} more`;
      }
    } else if (!multiple && selectedFiles.name) {
      buttonText = selectedFiles.name;
    }
  }

  return (
    <label className="block w-full max-w-sm mx-auto cursor-pointer">
      <span className="block w-full text-sm text-slate-500 bg-white border border-gray-300 rounded-md px-3 py-2 text-center hover:bg-gray-50 truncate" style={{ display: 'block', 'margin-top': '2px'}}>
        {buttonText}
      </span>
      <input
        type="file"
        className="hidden"
        multiple={multiple}
        accept={acceptedFileType}
        onChange={onChange}
      />
    </label>
  );
};

const ToolboxPanel = ({ visible, onClose, socket, roomId, initialOutput = "" }) => {
  const [activeTab, setActiveTab] = useState("scrape");
  const [syllabus, setSyllabus] = useState(null);
  const [pyqs, setPyqs] = useState(null);
  const [pptFile, setPptFile] = useState(null);
  const [scrapeURL, setScrapeURL] = useState("");
  const [output, setOutput] = useState(initialOutput || "");
  const [loading, setLoading] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!syllabus || !pyqs) {
      alert("Please upload both a syllabus and at least one PYQ file.");
      return;
    }
    const formData = new FormData();
    formData.append("syllabus", syllabus);
    for (let i = 0; i < pyqs.length; i++) {
      formData.append("pyqs", pyqs[i]);
    }
    setLoading(true);
    setOutput("Generating questions, please wait...");
    try {
      const res = await pythonApi.post("/generate-questions", formData);
      const formattedOutput = res.data.generated_questions
        .map(
          (item) =>
            `Topic: ${item.topic}\nGenerated Questions:\n- ${item.generated_questions.join("\n- ")}`
        )
        .join("\n\n");
      setOutput(formattedOutput);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setOutput(`Question generation failed: ${errorMsg}`);
      alert(`Question generation failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizePPT = async () => {
    if (!pptFile) return;
    const formData = new FormData();
    formData.append("file", pptFile);
    setLoading(true);
    setOutput("Summarizing PPT, please wait...");
    try {
      const res = await pythonApi.post("/summarize-ppt", formData);
      const summaryText = res.data.summary
        .map((s) => `Summary for Slides ${s.slide[0]}-${s.slide[1]}:\n${s.summary}`)
        .join("\n\n");
      setOutput(summaryText);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Unknown error";
      setOutput(`PPT summarization failed: ${message}`);
      alert("PPT summarization failed: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeWebsite = async () => {
    if (!scrapeURL) return;
    setLoading(true);
    setOutput(`Scraping ${scrapeURL}...`);
    try {
      const res = await pythonApi.post("/scrape", { url: scrapeURL });
      setOutput(res.data.content);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setOutput(`Web scraping failed: ${errorMsg}`);
      alert(`Web scraping failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const shareRequest = () => {
    if (!output || !socket) return;
    socket.emit("share-scrape-request", { roomId, content: output });
    alert("Content has been shared with the room!");
  };

  useEffect(() => {
    if (!visible || !socket) return;
    const onScrapeShared = ({ content }) => {
      setOutput(content);
    };
    socket.on("scrape-shared", onScrapeShared);
    return () => {
      socket.off("scrape-shared", onScrapeShared);
    };
  }, [visible, socket]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-300 rounded-lg shadow-2xl z-50 max-h-[70vh] flex flex-col max-w-5xl mx-auto">
      <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg" style={{ display: 'flex', gap: '1rem' }}>
    <div className="flex items-center gap-2" style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab("question")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "question"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Question
          </button>
          <button
            onClick={() => setActiveTab("ppt")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "ppt"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Summarize
          </button>
          <button
            onClick={() => setActiveTab("scrape")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "scrape"
                ? "bg-yellow-500 text-black shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Scrape
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-600 font-bold text-2xl px-2"
        >
          &times;
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="w-full text-center">
          {activeTab === "question" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Generate Questions</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Upload a syllabus and PYQ PDFs to generate potential new
                questions.
              </p>
              <div className="text-left max-w-sm mx-auto space-y-1">
                <label className="text-sm font-medium text-gray-700">Syllabus (1 PDF):</label>
                <StyledFileInput
                  acceptedFileType=".pdf"
                  selectedFiles={syllabus}
                  onChange={(e) => setSyllabus(e.target.files[0])}
                />
              </div>
              <div className="text-left max-w-sm mx-auto space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Previous Questions (Multi-PDFs):
                </label>
                <StyledFileInput
                  acceptedFileType=".pdf"
                  multiple
                  selectedFiles={pyqs}
                  onChange={(e) => setPyqs(e.target.files)}
                />
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={loading}
                className="w-full max-w-sm mx-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          )}
          {activeTab === "ppt" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Summarize PPT</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Upload a .pptx file to get an AI-generated summary of that's content.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="text-left max-w-sm mx-auto space-y-1">
                <label className="text-sm font-medium text-gray-700">PowerPoint File (.pptx):</label>
                <StyledFileInput
                  acceptedFileType=".pptx"
                  selectedFiles={pptFile}
                  onChange={(e) => setPptFile(e.target.files[0])}
                />
              </div>
              <button
                onClick={handleSummarizePPT}
                style={{height: '39px', 'margin-top' : '53px'}}
                disabled={loading}
                className="w-full max-w-sm mx-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                {loading ? "Summarizing..." : "Summarize"}
              </button>
                </div>
            </div>
          )}
          {activeTab === "scrape" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Scrape Website</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Enter a URL to extract the main article content.(Wikepedia, News Articles)
              </p>
              <div className="parent-search" style={{display : 'flex', gap : '1rem'}}>
                <input
                  type="text"
                  value={scrapeURL}
                  onChange={(e) => setScrapeURL(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full max-w-sm mx-auto p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleScrapeWebsite}
                  disabled={loading}
                  className="w-full max-w-sm mx-auto px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                >
                {loading ? "Scraping..." : "Scrape"}
              </button>
              </div>
            </div>
          )}
        </div>
        {output && (
          <div className="mt-6 w-full max-w-xl mx-auto">
            <h3 className="text-left font-semibold mb-1 text-gray-700">Output:</h3>
            <textarea
              readOnly
              value={output}
              className="w-full p-2 border rounded bg-gray-50 text-sm"
              rows={8}
            />
            <div className="mt-2 text-center">
              <button
                onClick={shareRequest}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Share to Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolboxPanel;
