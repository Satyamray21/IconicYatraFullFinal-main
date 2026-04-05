// models/homePage.model.js
import mongoose from "mongoose";

const slideSchema = new mongoose.Schema({
  image: String,
  imageName: String,
  title: String,
  duration: String,
  buttonText: String,
});

const featureSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: String,
  iconName: String,
});

const achievementSchema = new mongoose.Schema({
  icon: String,
  iconName: String,
  value: String,
  label: String,
});

const homePageSchema = new mongoose.Schema(
  {
    heroSlider: {
      slides: [slideSchema],
    },

    whyChooseUs: {
      mainDescription: String,
      features: [featureSchema],
    },

    trustedAgency: {
      heading: {
        type: String,
        default: "Most Trusted Travel Agency",
      },
      description: String,
    },

    achievements: {
      title: {
        type: String,
        default: "Our Achievements",
      },
      achievements: [achievementSchema],
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomePage", homePageSchema);
