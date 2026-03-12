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
    question: "What are the highlights of your Darjeeling & Sikkim tour packages?",
    answer:
      "Our packages include popular destinations like Darjeeling, Gangtok, Pelling, Tsomgo Lake, Nathula Pass, Yumthang Valley, and beautiful Himalayan viewpoints such as Tiger Hill.",
  },
  {
    question: "Are Darjeeling & Sikkim tours suitable for families?",
    answer:
      "Yes, these destinations are perfect for families. Our packages include comfortable hotels, sightseeing tours, and activities suitable for both kids and adults.",
  },
  {
    question: "What is usually included in Darjeeling & Sikkim tour packages?",
    answer:
      "Packages generally include hotel accommodation, local transportation, sightseeing tours, airport or railway station transfers, and selected meals depending on the plan.",
  },
  {
    question: "Can I customize my Darjeeling & Sikkim itinerary?",
    answer:
      "Yes, we provide fully customizable tour packages. You can choose destinations, hotel categories, travel duration, and activities according to your preferences and budget.",
  },
  {
    question: "Is Nathula Pass included in the Sikkim tour package?",
    answer:
      "Nathula Pass can be included depending on permit availability and weather conditions. Our team helps arrange the required permits for visiting the pass.",
  },
  {
    question: "What is the best time to visit Darjeeling and Sikkim?",
    answer:
      "The best time to visit is from March to June and September to December when the weather is pleasant and the mountain views are clear.",
  },
  {
    question: "How do I book a Darjeeling & Sikkim tour package?",
    answer:
      "You can easily book through our website, request a call back from our travel experts, or contact us directly for personalized assistance.",
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