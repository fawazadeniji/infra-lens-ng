import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Camera, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Fixing Nigeria, One Report at a Time
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    InfraFix helps you report and track infrastructure issues in your community, from potholes to power outages.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link to="/report">
                      Report an Issue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/dashboard">
                      View Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
                <img
                    src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/75d7b901-0078-4a36-b62e-18154fd65c59/logo-04d53239-1783329611388.webp"
                    alt="Hero"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-contain sm:w-full lg:order-last lg:aspect-square"
                />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Simple, Powerful Process</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We've streamlined the process of reporting infrastructure problems to make it as easy as possible for you to make a difference.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="flex items-center justify-center rounded-full bg-primary p-4">
                    <Camera className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">1. Snap & Report</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly capture a photo of the issue and fill out a simple form on our platform.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="flex items-center justify-center rounded-full bg-primary p-4">
                    <MapPin className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">2. We Verify & Locate</h3>
                <p className="text-sm text-muted-foreground">
                  Our team verifies the report and pinpoints the exact location on our national infrastructure map.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="flex items-center justify-center rounded-full bg-primary p-4">
                    <CheckCircle className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">3. Track to Resolution</h3>
                <p className="text-sm text-muted-foreground">
                  Follow the progress of your report and get notified when the issue is resolved.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Make a Difference?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of other Nigerians in building a better-functioning society. Your report matters.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
                <Button asChild size="lg">
                    <Link to="/report">
                        Report an Issue Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center py-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} InfraFix Nigeria. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
