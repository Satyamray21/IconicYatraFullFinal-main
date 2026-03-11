import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    question: "What are the highlights of your Gujarat tour packages?",
    answer:
      "Our Gujarat tours include destinations like Dwarka, Somnath, Gir National Park, Rann of Kutch, Diu beaches, and Saputara hill station.",
  },
  {
    question: "Are Gujarat tours suitable for families and kids?",
    answer:
      "Yes, our Gujarat packages are family-friendly and include attractions suitable for kids and families.",
  },
  {
    question: "What's included in Gujarat tour packages?",
    answer:
      "Packages usually include accommodation, sightseeing, transfers, meals, and guided tours.",
  },
  {
    question: "Can I customize my Gujarat itinerary?",
    answer:
      "Yes, we offer customizable itineraries based on your travel preferences and budget.",
  },
  {
    question: "Are Gujarat tours suitable for senior citizens?",
    answer:
      "Yes, we provide comfortable travel plans with relaxed schedules for senior travelers.",
  },
  {
    question: "What is the best time to visit Gujarat?",
    answer:
      "October to March is the best time because the weather is pleasant.",
  },
  {
    question: "How do I book a Gujarat tour package?",
    answer:
      "You can book online, request a callback, or contact our travel experts.",
  },
];

const FAQSection = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ background: "#f5f5f5", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Frequently Asked Questions
        </Typography>

        {faqs.map((faq, index) => (
          <Accordion
            key={index}
            expanded={expanded === index}
            onChange={handleChange(index)}
            sx={{
              boxShadow: "none",
              border: "1px solid #ddd",
              "&:not(:last-child)": { borderBottom: 0 },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontSize={15}>
                {index + 1}. {faq.question}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Typography fontSize={14} color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
};

export default FAQSection;