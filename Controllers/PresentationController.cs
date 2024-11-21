using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using task6.Hub;
using task6.Models;

namespace task6.Controllers
{
    public class PresentationController : Controller
    {
        private readonly PresentationHub _presentationHub;
        public PresentationController(PresentationHub presentation)
        {
            _presentationHub = presentation;
        }

        public IActionResult Index()
        {
            return View(_presentationHub.Presentations);
        }

        public IActionResult Privacy()
        {
            return View();
        }

    }
}
