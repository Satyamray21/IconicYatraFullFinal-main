import re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace getStandardHotelPrice
    pattern = r'(?s)const getStandardHotelPrice = \(pkg\) => \{.*?\n  \};'
    
    replacement = '''const getStandardHotelPrice = (pkg) => {
    if (!pkg.destinationNights || !Array.isArray(pkg.destinationNights)) {
      return "Price on request";
    }

    let totalPrice = 0;
    pkg.destinationNights.forEach(destination => {
      const standardHotel = destination.hotels?.find(hotel =>
        hotel.category?.toLowerCase() === "standard"
      );
      if (standardHotel && standardHotel.pricePerPerson) {
        totalPrice += (standardHotel.pricePerPerson * (destination.nights || 0));
      }
    });

    if (totalPrice > 0) {
      return ₹;
    }

    return "Price on request";
  };'''

    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes for {filepath}")

# Process files
files = [
    r'c:\IconicYatraFullFinal-main\IconicYatraUI-main\src\Components\SpecialPackages.jsx',
    r'c:\IconicYatraFullFinal-main\IconicYatraUI-main\src\Components\HolidaysPackages.jsx',
    r'c:\IconicYatraFullFinal-main\IconicYatraUI-main\src\Components\FeaturedPackages.jsx'
]

for f in files:
    update_file(f)

