import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { useParams } from "react-router-dom";
import { db, storage } from "../../firebaseModel";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import "./style.css";

export function VisualizationView(props) {
  const lineChartRef = useRef(null);
  const scatterChartRef = useRef(null);
  const { id } = useParams(); // Get ID from URL params
  const [touchData, setTouchData] = useState(null); // To store Firestore data
  const [selectedImage, setSelectedImage] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]); // State to store media URLs
  const defaultImage = "../../img.png"; // Default image URL
  const images = new Array(12).fill(defaultImage); // Array of default images

  const currentUser = props.userName; // Assuming userName is passed as a prop
  const isAuthor = touchData?.userName === currentUser;

  // Fetch Firestore data based on the ID
  useEffect(() => {
    const fetchTouchData = async () => {
      try {
        const docRef = doc(db, "touches", id); // Use URL-safe ID
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTouchData(docSnap.data());
          setEditedName(docSnap.data().name); // Set the initial name value
          setEditedDescription(docSnap.data().description); // Set the initial description value
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
      }
    };

    fetchTouchData();
  }, [id]);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const folderRef = ref(storage, `touchMedia/${id}`);
        const result = await listAll(folderRef);
        const urls = await Promise.all(
          result.items.map((itemRef) => getDownloadURL(itemRef))
        );
        setMediaUrls(urls);
      } catch (error) {
        console.error("Error loading media: ", error);
        setMediaUrls([]); // Ensure mediaUrls is initialized even on error
      }
    };

    loadMedia();
  }, [id]);

  const handleFileUpload = async (files) => {
    if (isAuthor) {
      for (const file of files) {
        try {
          const storageRef = ref(storage, `touchMedia/${id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          setMediaUrls((prev) => [...prev, downloadURL]);
        } catch (error) {
          console.error("Error uploading file: ", error);
        }
      }
    } else {
      alert("You are not the author of this touch and cannot upload files.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Initialize line chart
  useEffect(() => {
    const lineCtx = lineChartRef.current?.getContext("2d");

    if (lineCtx) {
      const lineData = {
        labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        datasets: [
          {
            label: "Pressure over Time",
            data: [12, 19, 3, 5, 2, 2, 12, 19, 3, 10, 10],
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(241, 245, 249, 1)",
            fill: true,
            borderWidth: 3,
          },
        ],
      };

      const lineConfig = {
        type: "line",
        data: lineData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          elements: {
            line: { tension: 0.1 },
          },
        },
      };

      const lineChart = new Chart(lineCtx, lineConfig);

      return () => {
        lineChart.destroy();
      };
    }
  }, []);

  // Initialize scatter chart when visible and touchData is available
  useEffect(() => {
    const scatterCtx = scatterChartRef.current?.getContext("2d");

    if (isChartVisible && scatterCtx && touchData?.data?.[0]?.x !== undefined && touchData?.data?.[0]?.y !== undefined) {
      const scatterData = {
        datasets: [
          {
            label: 'Scatter Dataset',
            data: [
              { x: touchData.data[0].x, y: touchData.data[0].y },
            ],
            backgroundColor: 'rgb(255, 99, 132)',
          },
        ],
      };

      const scatterConfig = {
        type: "scatter",
        data: scatterData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              type: "linear",
              display: true,
              position: 'center',
              grid: { display: false },
              ticks: { display: false },
              min: -15,  // Minimum value for the x-axis
              max: 15,   // Maximum value for the x-axis
              border: { width: 3, color: "black" },
            },
            y: {
              type: "linear",
              display: true,
              position: 'center',
              grid: { display: false },
              ticks: { display: false },
              min: -15,   // Minimum value for the y-axis
              max: 15,   // Maximum value for the y-axis
              border: { width: 3, color: "black" },
            },
          }
        },
        plugins: [
          {
            id: "backgroundCircle",
            beforeDraw: (chart) => {
              const { ctx, chartArea } = chart;
              const centerX = (chartArea.left + chartArea.right) / 2;
              const centerY = (chartArea.top + chartArea.bottom) / 2;
              const radius = Math.min(chartArea.width, chartArea.height) / 2.1;

              // Draw the circular outline (stroke only)
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.lineWidth = 2;
              ctx.strokeStyle = "rgba(0, 0, 0, 1)";
              ctx.stroke();

              // Draw axis labels
              ctx.font = "16px Arial";
              ctx.fillStyle = "black";
              ctx.textAlign = "center";

              // Label for positive Y axis (High Arousal)
              ctx.save();
              ctx.translate(centerX - 5, chartArea.top + 70);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText("High Arousal", 0, 0);
              ctx.restore();

              // Label for negative Y axis (Low Arousal)
              ctx.save();
              ctx.translate(centerX + 5, chartArea.bottom - 70);
              ctx.rotate(Math.PI / 2);
              ctx.fillText("Low Arousal", 0, 0);
              ctx.restore();

              // Label for positive X axis (Pleasure)
              ctx.fillText("Pleasure", chartArea.right - 60, centerY - 5);

              // Label for negative X axis (Displeasure)
              ctx.fillText("Displeasure", chartArea.left + 70, centerY - 5);

              ctx.restore();
            },
          },
        ],
      };

      const scatterChart = new Chart(scatterCtx, scatterConfig);

      return () => {
        scatterChart.destroy();
      };
    }
  }, [isChartVisible, touchData]);

  // Handle name editing
  const handleNameEdit = () => {
    if (isAuthor) {
      const updateData = async () => {
        try {
          const docRef = doc(db, "touches", id);
          await updateDoc(docRef, { name: editedName });
        } catch (error) {
          console.error("Error updating document: ", error);
        }
      };
      updateData();
      setIsEditingName(!isEditingName);
    } else {
      alert("You are not the author of this touch and cannot edit the name.");
    }
  };

  // Handle description editing
  const handleDescriptionEdit = () => {
    if (isAuthor) {
      const updateData = async () => {
        try {
          const docRef = doc(db, "touches", id);
          await updateDoc(docRef, { description: editedDescription });
        } catch (error) {
          console.error("Error updating document: ", error);
        }
      };
      updateData();
      setIsEditingDescription(!isEditingDescription);
    } else {
      alert("You are not the author of this touch and cannot edit the description.");
    }
  };

  function handleImageClick(image) {
    setSelectedImage(image);
  }

  function closeImage(e) {
    // Close only when clicking on the top part of the modal
    if (e.target.classList.contains("lightbox")) {
      setSelectedImage(null);
    }
  }

  return (
    <div className="main">
      <div className="holder">
        <h2>
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
            />
          ) : (
            touchData ? touchData.name : "Loading..."
          )}

          {touchData && touchData.userName === currentUser && (
            <button onClick={handleNameEdit}>
              {isEditingName ? "Save Name" : "Edit Name"}
            </button>
          )}
        </h2>

        <p><strong>Author:</strong> {touchData ? touchData.userName : "Loading..."}</p>

        <p>
          {isEditingDescription ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
          ) : (
            touchData ? touchData.description : "Loading..."
          )}

          {touchData && touchData.userName === currentUser && (
            <button onClick={handleDescriptionEdit}>
              {isEditingDescription ? "Save Description" : "Edit Description"}
            </button>
          )}
        </p>

        <button>Play</button>

        <div className="chart">
          <canvas ref={lineChartRef}></canvas>
        </div>

        <div className="dropdown">
          russell circumplex model
          <button onClick={() => setIsChartVisible(!isChartVisible)}>
            Open
          </button>
          {isChartVisible && (
            <div>
              <canvas ref={scatterChartRef} className="visualization__chart-two"></canvas>
            </div>
          )}
        </div>

        <div className="dropdown">
          Media Gallery
          <button onClick={() => setIsGalleryVisible(!isGalleryVisible)}>
            Open
          </button>

          {isGalleryVisible && (
            <>
              {isAuthor && (
                <div
                  className="upload-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  Drag and drop files here or
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    style={{ marginLeft: "10px" }}
                  />
                </div>
              )}
            

              <div className="gallery-grid">
                {mediaUrls.map((url, index) =>
                  url.match(/\.(mp4|webm)$/i) ? (
                    <video
                      key={index}
                      src={url}
                      controls
                      className="thumbnail"
                      style={{ maxHeight: "150px" }}
                    />
                  ) : (
                    <img
                      key={index}
                      src={url}
                      alt={`Media ${index}`}
                      className="thumbnail"
                      onClick={() => handleImageClick(url)}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>

        {selectedImage && (
          <div className="lightbox" onClick={closeImage}>
            <img
              src={selectedImage}
              alt="Enlarged"
              className="enlarged-image"
            />
          </div>
        )}
      </div>
    </div>
  );
}