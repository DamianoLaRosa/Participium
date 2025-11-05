import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useActionState } from "react";
import { Row, Col, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router";
import "../App.css";
import API from "../API/API.mjs"; 

const CATEGORIES = [
  "Water Supply – Drinking Water",
  "Architectural Barriers",
  "Sewer System",
  "Public Lighting",
  "Waste",
  "Road Signs and Traffic Lights",
  "Roads and Urban Furnishings",
  "Public Green Areas and Playgrounds",
  "Other"
];

export function InsertReportPage(props) {
  const [message, setMessage] = useState("");
  const [reportCreated, setReportCreated] = useState(null);

  const handleInsertReport = async (reportData) => {
    try {
      // Simula chiamata API
      // const result = await API.createReport(reportData);
      
      // Simulo una risposta di successo
      const result = {
        ...reportData,
        latitude: props.latitude,
        longitude: props.longitude,
        user: props.user
      };
      
      setReportCreated(result);

      // NAVIGATEEEEEEEEEEEEEEEEEEEEEEEEEEE

    } catch (err) {
      setMessage({ msg: err.message || err, type: 'danger' });
    }
  };

  return (
    <>
      {reportCreated ? (
        <ReportSummary report={reportCreated} user={props.user} message={message}/>
      ) : (
        <InsertReportForm handleInsertReport={handleInsertReport} message={message} latitude={props.latitude} longitude={props.longitude} user={props.user}/>
      )}
    </>
  );
}

function InsertReportForm(props) {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]); //images
  const [state, formAction, isPending] = useActionState(insertReportFunction, {
    title: '',
    description: '',
    category: '',
    anonymous: false,
    images: []
  });

  async function insertReportFunction(prevState, formData) {
    const reportData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      anonymous: formData.get('anonymous') === 'on',
      images: selectedFiles,
      latitude: props.latitude,
      longitude: props.longitude
    };

    try {
      await props.handleInsertReport(reportData);
      return { success: true };
    } catch (error) {
      return {
        title: '',
        description: '',
        category: '',
        anonymous: false,
        images: []
      };
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert('You can upload a maximum of 3 images');
      e.target.value = '';
      return;
    }
    setSelectedFiles(files);
  };

  return (
    <>
      {isPending && <Alert variant="warning"> Please, wait for the server's response...</Alert>}

      <Row className="scrollable-content">
        <Col md={8}>


          <Form action={formAction}>
            <Form.Group controlId="title" className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                required
                minLength={3}
                placeholder="Enter report title"
              />
            </Form.Group>

            <Form.Group controlId="description" className="mb-3">
              <Form.Label>Textual Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                required
                minLength={10}
                placeholder="Describe the problem in detail"
              />
            </Form.Group>

            <Form.Group controlId="category" className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select name="category" required>
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="images" className="mb-3">
              <Form.Label>Images * (1-3 photos required)</Form.Label>
              <Form.Control
                type="file"
                name="images"
                accept="image/*"
                multiple
                required
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                You can upload up to 3 images. {selectedFiles.length > 0 && `${selectedFiles.length} file(s) selected.`}
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="anonymous" className="mb-3">
              <Form.Check
                type="checkbox"
                name="anonymous"
                label="Make this report anonymous (your name will not be visible in the public list)"
              />
            </Form.Group>

            <div className="footer-buttons">
              <Button 
                variant="secondary" 
                onClick={() => navigate && navigate(-1)}
                disabled={isPending}
                className="me-2"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || selectedFiles.length === 0}>
                Submit Report
              </Button>
            </div>
          </Form>


        </Col>
      </Row>
    </>
  );
}

function ReportSummary({ report, user }) {
  const navigate = useNavigate();

  return (
    <Row className="scrollable-content">
      <Col md={8}>

        <h3 className="mb-4">Report Created Successfully</h3>
        
        <Alert variant="success" dismissible>
          Your report has been submitted successfully!
        </Alert>

        <div className="border rounded p-4 mb-3">
          <h5>Report Details</h5>
          <hr />
          <p><strong>Title:</strong> {report.title}</p>
          <p><strong>Latitude:</strong> {report.latitude} <strong>Longitude:</strong> {report.longitude}</p>
          <p><strong>Description:</strong> {report.description}</p>
          <p><strong>Category:</strong> {report.category}</p>
          <p><strong>Anonymous:</strong> {report.anonymous ? 'Yes' : 'No'}</p>
          <p><strong>Images:</strong> {report.images.length} file(s) attached</p>
        </div>

        {!report.anonymous && <div className="border rounded p-4 mb-3">
          <h5>User Information</h5>
          <hr />
          <p><strong>User:</strong> {user.name || user.username}</p>
          {user.email && <p><strong>Email:</strong> {user.email}</p>}
        </div>}

        <div className="footer-buttons">
          <Button onClick={() => navigate && navigate('/')}> Back to Home </Button>
        </div>

      </Col>
    </Row>
  );
}