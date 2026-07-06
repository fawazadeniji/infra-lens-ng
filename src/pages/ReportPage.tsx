"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, MapPin, UploadCloud, CheckCircle, AlertTriangle, LoaderCircle } from "lucide-react";

// Define the structure of the AI analysis result
interface AIAnalysisResult {
  is_valid_infrastructure: boolean;
  category: string;
  severity: string;
  hazard_description: string;
  immediate_action_recommendation: string;
}

// Define the structure for the API response
interface ApiResponse {
  success: boolean;
  is_valid: boolean;
  report: AIAnalysisResult;
  error?: string;
}

/**
 * Compresses an image file to a maximum width and returns a base64 string.
 * @param file The image file to compress.
 * @param maxWidth The maximum width of the compressed image.
 * @returns A promise that resolves with the base64 string (without the data URI prefix).
 */
const compressImage = (file: File, maxWidth: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("Failed to get canvas context"));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Get the data URL and remove the prefix
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * A mobile-first component for capturing and reporting infrastructure issues.
 */
export default function ReportPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    // Reset state for new report
    setImagePreview(null);
    setBase64Image(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusText("Compressing image...");
    toast.promise(compressImage(file),
      {
        loading: 'Compressing image...',
        success: (imgBase64) => {
            setBase64Image(imgBase64);
            // Create a temporary URL for preview
            const blob = new Blob([file]);
            setImagePreview(URL.createObjectURL(blob));
            setIsLoading(false);
            return 'Image ready for submission!';
        },
        error: (err) => {
            console.error(err);
            setError("Failed to process image. Please try another photo.");
            setIsLoading(false);
            return "Failed to process image.";
        }
      });
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          let message = "Failed to get location.";
          switch(err.code) {
              case err.PERMISSION_DENIED:
                  message = "Location access denied. Please enable it in your browser settings.";
                  break;
              case err.POSITION_UNAVAILABLE:
                  message = "Location information is unavailable.";
                  break;
              case err.TIMEOUT:
                  message = "The request to get user location timed out.";
                  break;
          }
          reject(new Error(message));
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (!base64Image) {
      toast.error("No image captured. Please capture an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Get Location
      setStatusText("Getting location...");
      const { lat, lng } = await getCurrentLocation();

      // 2. Submit to API
      setStatusText("Analyzing report...");
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image, lat, lng }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to submit report.");
      }
      
      if (data.success) {
        toast.success("Report analyzed successfully!");
        setResult(data.report);
      } else {
         throw new Error("Analysis failed to complete.");
      }

    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">InfraFix Nigeria</CardTitle>
          <CardDescription>Report local infrastructure issues in seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {imagePreview ? (
                <div className="space-y-4 text-center">
                    <img src={imagePreview} alt="Captured issue" className="rounded-lg w-full h-auto object-cover"/>
                    <Button onClick={handleSubmit} disabled={isLoading} className="w-full text-lg py-6">
                      {isLoading ? <LoaderCircle className="animate-spin mr-2"/> : <UploadCloud className="mr-2" />}
                      {isLoading ? statusText : "Submit Report"}
                    </Button>
                </div>
            ) : (
                <div className="text-center space-y-4">
                    <div className="mx-auto bg-gray-100 rounded-lg w-full h-48 flex items-center justify-center">
                        <Camera className="text-gray-400" size={48}/>
                    </div>
                    <Button onClick={handleCaptureClick} className="w-full text-lg py-6">
                        <Camera className="mr-2"/> Capture Issue
                    </Button>
                </div>
            )}
            
            {/* Hidden file input */} 
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {error && (
                <div className="text-red-600 bg-red-100 p-3 rounded-md flex items-center gap-2">
                    <AlertTriangle size={20}/> <span>{error}</span>
                </div>
            )}

            {result && (
              <Card className={`border-t-4 ${result.is_valid_infrastructure ? 'border-green-500' : 'border-amber-500'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {result.is_valid_infrastructure ? <CheckCircle className="text-green-500"/> : <AlertTriangle className="text-amber-500"/>}
                    Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {result.is_valid_infrastructure ? (
                    <div className="space-y-3">
                      <div><strong>Category:</strong> <span className="capitalize">{result.category.replace('_', ' ')}</span></div>
                      <div><strong>Severity:</strong> <span className="capitalize">{result.severity}</span></div>
                      <div><strong>Hazard:</strong> {result.hazard_description}</div>
                      <div><strong>Recommendation:</strong> {result.immediate_action_recommendation}</div>
                    </div>
                  ) : (
                    <p>{result.hazard_description || "The AI determined this is not a valid infrastructure issue."}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
      <footer className="text-center mt-6 text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} InfraFix Nigeria. Built for the community.</p>
      </footer>
    </div>
  );
}
